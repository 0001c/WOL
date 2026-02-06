import paramiko

ip = "192.168.31.69"
username = "winrm"
password = "223988"
def shutdown_pc(ip, username, password):
    """
    通过SSH连接到目标PC并发送关机命令。
    """
    try:
        # 创建SSH客户端
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())  # 自动接受未知主机密钥
        ssh.connect(ip, username=username, password=password)
        
        # 执行关机命令
        command = "shutdown /s /t 0"  # Windows关机命令
        stdin, stdout, stderr = ssh.exec_command(command)
        print("关机命令已发送。")
        
        # 打印执行结果
        print(stdout.read().decode())
        print(stderr.read().decode())
        
        # 关闭SSH连接
        ssh.close()
    except Exception as e:
        print(f"远程关机失败：{e}")

if __name__ == "__main__":
    shutdown_pc(ip, username, password)