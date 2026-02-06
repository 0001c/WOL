# -*- coding: utf-8 -*-
# 以下代码在2021年10月21日 python3.10环境下运行通过

from math import log
import os
import time
import paho.mqtt.client as mqtt

import open as wol_open
import shutdown


    

import http.server
import socketserver
import json
import urllib.parse

# 从虚拟变量中获取CLIENT_ID
CLIENT_ID = os.getenv("CLIENT_ID")
# 全局日志消息队列
log_queue = []

def add_log_message(message, log_type='info', source='mqtt'):
    """添加一条日志消息到队列"""
    global log_queue
    log_queue.append({
        'timestamp': time.time(),
        'message': message,
        'type': log_type,
        'source': source
    })

class ConfigHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # 设置静态文件目录为web目录
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        # 处理API请求
        if self.path == '/api/config':
            self._handle_get_config()
        elif self.path == '/api/logs':
            self._handle_get_logs()
        else:
            # 处理静态文件请求
            # 为静态文件请求设置目录
            self.directory = 'web'
            super().do_GET()
    
    def do_POST(self):
        # 处理API请求
        if self.path == '/api/config':
            self._handle_post_config()
        else:
            self.send_error(404, "Not Found")
    
    def _handle_get_config(self):
        """处理获取配置的请求"""
        try:
            # 读取config.json文件
            with open('config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # 发送响应
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(config).encode('utf-8'))
            print("[API] 配置数据已成功获取")
        except FileNotFoundError:
            # 配置文件不存在，返回默认配置
            default_config = {"clients": []}
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(default_config).encode('utf-8'))
            print("[API] 配置文件不存在，返回默认配置")
        except json.JSONDecodeError as e:
            # JSON解析错误
            self.send_error(400, f"Bad Request: Invalid JSON format - {str(e)}")
            print(f"[API] JSON解析错误: {str(e)}")
        except Exception as e:
            # 其他错误
            self.send_error(500, f"Internal Server Error: {str(e)}")
            print(f"[API] 内部服务器错误: {str(e)}")
    
    def _handle_post_config(self):
        """处理保存配置的请求"""
        try:
            # 读取请求体
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # 解析JSON数据
            config_data = json.loads(post_data.decode('utf-8'))
            
            # 验证配置数据格式
            if not isinstance(config_data, dict) or 'clients' not in config_data:
                self.send_error(400, "Bad Request: Invalid config format")
                print("[API] 配置数据格式错误")
                return
            
            # 验证每个客户端项
            for client in config_data['clients']:
                required_fields = ['topic', 'target_mac', 'broadcast_ip', 'ip', 'username', 'password']
                if not all(field in client for field in required_fields):
                    self.send_error(400, f"Bad Request: Missing required field in client {client.get('topic', 'unknown')}")
                    print(f"[API] 客户端配置缺失必填项: {client.get('topic', 'unknown')}")
                    return
            
            # 保存到config.json文件
            with open('config.json', 'w', encoding='utf-8') as f:
                # 判断是否新增客户端
                if 'clients' in config_data and config_data['clients']:
                    # 新增客户端，重启MQTT线程
                    restart_mqtt_thread()
                json.dump(config_data, f, indent=2, ensure_ascii=False)
            
            # 发送成功响应
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            print(f"[API] 配置数据已成功保存，客户端数量: {len(config_data.get('clients', []))}")
        except json.JSONDecodeError as e:
            # JSON解析错误
            self.send_error(400, f"Bad Request: Invalid JSON format - {str(e)}")
            print(f"[API] JSON解析错误: {str(e)}")
        except Exception as e:
            # 其他错误
            self.send_error(500, f"Internal Server Error: {str(e)}")
            print(f"[API] 内部服务器错误: {str(e)}")
    
    def _handle_get_logs(self):
        """处理获取日志消息的请求"""
        try:
            global log_queue
            
            # 获取当前日志消息队列
            logs = log_queue.copy()
            
            # 清空日志消息队列，避免重复发送
            log_queue.clear()
            
            # 发送响应
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'logs': logs}).encode('utf-8'))
            print(f"[API] 已发送 {len(logs)} 条日志消息")
        except Exception as e:
            # 其他错误
            self.send_error(500, f"Internal Server Error: {str(e)}")
            print(f"[API] 内部服务器错误: {str(e)}")

def create_config(topic=None):
    """创建一个网页，用于配置目标PC的信息"""
    # 启动HTTP服务器
    PORT = 18808
    
    # 模拟一个MQTT消息接收事件，用于测试
    # import threading
    # def simulate_mqtt_message():
        # import time
        # time.sleep(5)  # 等待5秒，确保服务器已经启动
        # global log_queue
        # # 模拟收到一条MQTT消息
        # log_message = "收到消息：on 来自主题：test_topic"
        # print(f"[SIMULATION] {log_message}")
        # # 添加到日志消息队列
        # add_log_message(log_message)
        
        # # 模拟发送WOL数据包
        # log_message = "正在发送WOL数据包到MAC地址：AA-BB-CC-DD-EE-FF，广播地址：192.168.31.255"
        # print(f"[SIMULATION] {log_message}")
        # # 添加到日志消息队列
        # add_log_message(log_message)
        
        # # 模拟发送完成
        # log_message = "发送完成！请检查目标PC是否启动。"
        # print(f"[SIMULATION] {log_message}")
        # # 添加到日志消息队列
        # add_log_message(log_message, log_type='success')
    
    # 启动模拟线程
    # threading.Thread(target=simulate_mqtt_message, daemon=True).start()
    
    with socketserver.TCPServer(("", PORT), ConfigHTTPRequestHandler) as httpd:
        print(f"配置界面已启动，访问地址: http://localhost:{PORT}")
        print("按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            pass



# 使用 net rpc 命令远程关机


              
#连接并订阅
def on_connect(client, userdata, flags, rc):
    print("连接成功，返回码： "+str(rc))
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
    for topics in config["clients"]:
        try:
            client.subscribe(topics["topic"])
            log_message = f"{topics['topic']} 连接成功"
            print(f"[LOG] {log_message}")
            # 添加到日志消息队列
            add_log_message(log_message, log_type='success')
        except Exception as e:
            log_message = f"{topics['topic']} 连接失败：{str(e)}"
            print(f"[LOG] {log_message}")
            # 添加到日志消息队列
            add_log_message(log_message, log_type='error')
            continue

def set_address(topic):
    """根据主题设置目标PC的MAC地址、广播IP、IP地址、用户名和密码"""
    # 从config.json文件中读取配置数据
    with open('config.json', 'r', encoding='utf-8') as f:
        config = json.load(f)
    try:
        for topics in config["clients"]:
            if topics["topic"] == topic:
                target_mac = topics["target_mac"]
                broadcast_ip = topics["broadcast_ip"]
                ip = topics["ip"]
                username = topics["username"]
                password = topics["password"]
                break
        else:
            # 主题未找到，返回默认值
            target_mac = "00-00-00-00-00-00"
            broadcast_ip = "0.0.0.0"
            ip = "0.0.0.0"
            username = "default"
            password = "default"
    except Exception as e:
        # 其他错误
        log_message = f"{topic} 主题未找到，返回默认值"
        print(f"[LOG] {log_message}")
        # 添加到日志消息队列
        add_log_message(log_message, log_type='error')
        target_mac = "00-00-00-00-00-00"
        broadcast_ip = "0.0.0.0"
        ip = "0.0.0.0"
        username = "default"
        password = "default"
    
    return target_mac, broadcast_ip, ip, username, password


#消息接收
def on_message(client, userdata, msg):
    global log_queue
    topic = msg.topic
    payload = str(msg.payload.decode('utf-8'))
    print(f"主题:{topic} 消息:{payload}")
    
    # 记录消息接收事件到日志
    log_message = f"收到消息：{payload} 来自主题：{topic}"
    print(f"[LOG] {log_message}")
    # 添加到日志消息队列
    add_log_message(log_message)
    
    global message
    message = payload
    target_mac, broadcast_ip, ip, username, password = set_address(topic)
    
    if payload == 'on':
        try:
            log_message = f"正在发送WOL数据包到MAC地址：{target_mac}，广播地址：{broadcast_ip}"
            print(f"[LOG] {log_message}")
            # 添加到日志消息队列
            add_log_message(log_message)
            
            for i in range(10):
                time.sleep(0.5)
                wol_open.send_wol_packet(target_mac, broadcast_ip)
                log_message = f"已发送第 {i+1} 个WOL包"
                print(f"[LOG] {log_message}")
                # 添加到日志消息队列
                add_log_message(log_message)
            
            log_message = "发送完成！请检查目标PC是否启动。"
            print(f"[LOG] {log_message}")
            # 添加到日志消息队列
            add_log_message(log_message, log_type='success')
        except Exception as e:
            error_message = f"发送失败：{e}"
            print(f"[LOG] {error_message}")
            # 添加到日志消息队列
            add_log_message(error_message, log_type='error')
    elif payload == 'off':
        log_message = f"正在关闭PC：{ip}，用户名：{username}"
        print(f"[LOG] {log_message}")
        # 添加到日志消息队列
        add_log_message(log_message)
        shutdown.shutdown_pc(ip, username, password)


#订阅成功
def on_subscribe(client, userdata, mid, granted_qos):
    print("On Subscribed: qos = %d" % granted_qos)

# 失去连接
def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("Unexpected disconnection %s" % rc)
        # 添加到日志消息队列
        add_log_message(f"失去连接：{rc}", log_type='error')


def active_mqtt():
    global mqtt_running
    mqtt_running = True
    HOST = "bemfa.com"
    PORT = 9501
    client_id = CLIENT_ID
    client = mqtt.Client(client_id=client_id)
    client.username_pw_set("userName", "passwd")
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    client.on_disconnect = on_disconnect
    client.connect(HOST, PORT, 60)
    log_message = "MQTT客户端已启动"
    print(f"[LOG] {log_message}")
    # 添加到日志消息队列
    add_log_message(log_message, log_type='info')
    times = 0
    while mqtt_running:
        times += 1

        client.loop(timeout=1.0)  # 处理MQTT消息
        if times % 60 == 0:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}]MQTT线程正在运行...")
        time.sleep(1)

def restart_mqtt_thread():
    """重启MQTT线程的函数"""
    global mqtt_thread, mqtt_running
    
    # 1. 停止原有线程（如果存在且正在运行）
    if mqtt_thread is not None and mqtt_thread.is_alive():
        print("正在停止原有MQTT线程...")
        mqtt_running = False  # 触发线程内部循环退出
        mqtt_thread.join(timeout=5)  # 等待线程结束，设置超时避免卡死
        
        # 如果超时后线程还活着，强制终止（不推荐，但作为兜底）
        if mqtt_thread.is_alive():
            print("警告：原有MQTT线程无法正常停止")
    
    # 2. 创建新的线程实例并启动
    print("启动新的MQTT线程...")
    mqtt_thread = threading.Thread(target=active_mqtt, daemon=True)
    mqtt_thread.start()
    log_message = "MQTT重启成功"
    print(f"[LOG] {log_message}")
    # 添加到日志消息队列
    add_log_message(log_message, log_type='info')
    


# client = mqtt.Client(client_id=client_id)
if __name__ == "__main__":
    import sys
    import threading
    
    # 检查命令行参数
    if len(sys.argv) > 1 and sys.argv[1] == "create_config":
        # 启动配置界面
        create_config()
    elif len(sys.argv) > 1 and sys.argv[1] == "active_mqtt":
        # 运行MQTT客户端
        active_mqtt()
    else:
        # 使用双线程分别运行create_config和active_mqtt
        print("启动双线程：配置界面和MQTT客户端")
        
        # 创建并启动配置界面线程
        config_thread = threading.Thread(target=create_config, daemon=True)
        config_thread.start()
        
        # 等待1秒，确保配置界面线程已经启动
        import time
        time.sleep(1)
        
        # 创建并启动MQTT客户端线程
        mqtt_thread = threading.Thread(target=active_mqtt, daemon=True)
        mqtt_thread.start()
        
        # 主线程保持运行，防止程序退出
        print("双线程已启动，按 Ctrl+C 停止程序")
        try:
            # 主线程无限循环，保持运行
            while True:
                import time
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n程序正在停止...")
            # 在这里可以添加清理代码
            print("程序已停止")