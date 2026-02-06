# WOL客户端配置系统

一个基于MQTT的WOL（Wake-on-LAN）客户端配置系统，支持远程唤醒和关闭PC功能，并提供Web界面进行配置管理。

## 功能特性

- **远程唤醒**：通过发送WOL幻数据包远程唤醒局域网内的PC
- **远程关机**：通过SSH连接远程关闭Windows PC
- **多客户端管理**：支持配置和管理多个客户端PC
- **Web配置界面**：提供现代化的Web界面进行客户端配置
- **实时日志记录**：记录系统消息接收和操作日志
- **双线程运行**：同时运行配置界面和MQTT客户端
- **Docker支持**：支持Docker容器化部署

## 系统要求

- Python 3.12+
- paho-mqtt
- paramiko
- 局域网环境
- MQTT服务器（默认使用巴法云）

## 安装步骤

### 1. 克隆或下载项目

```bash
git clone <repository-url>
cd WOL
```

### 2. 安装依赖

```bash
# 创建虚拟环境（可选）
python -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

或手动安装：

```bash
pip install paho-mqtt paramiko
```

### 3. 配置MQTT服务器

编辑 `main.py` 文件，修改以下配置：

```python
HOST = "your-mqtt-server.com"  # MQTT服务器地址
PORT = 9501  # MQTT服务器端口
client_id = "your-client-id"  # 客户端ID
client.username_pw_set("username", "password")  # MQTT认证信息
```

### 4. 配置客户端信息

编辑 `config.json` 文件，添加客户端配置信息：

```json
{
  "clients": [
    {
      "topic": "client1",
      "target_mac": "AA-BB-CC-DD-EE-FF",
      "broadcast_ip": "192.168.31.255",
      "ip": "192.168.31.100",
      "username": "winrm",
      "password": "your-password"
    }
  ]
}
```

## 使用方法

### 方式1：直接运行（开发环境）

```bash
# 运行MQTT客户端
python main.py

# 或运行配置界面
python main.py create_config

# 或同时运行配置界面和MQTT客户端
python main.py
```

### 方式2：Docker部署

#### 构建Docker镜像

```bash
# 构建镜像
docker build -t wol-project .

# 或使用自定义镜像名称
docker build -t my-wol-app .
```

#### 运行Docker容器

```bash
# 基本运行（不持久化存储）
docker run -p 18808:18808 wol-project

# 使用Docker卷持久化存储（推荐）
docker volume create wol-config
docker run -p 18808:18808 -v wol-config:/app/config.json wol-project

# 使用绑定挂载（开发环境）
docker run -p 18808:18808 -v $(pwd)/config.json:/app/config.json wol-project
```

#### 访问Web配置界面

在浏览器中打开：`http://localhost:18808`

## Web配置界面

### 功能说明

1. **客户端管理**
   - 添加新客户端（ps：需在巴法云提前配置好）
   - 编辑现有客户端配置
   - 删除客户端
   - 查看客户端列表

2. **配置字段**
   - Topic：MQTT主题标识符
   - MAC地址：目标PC的MAC地址（格式：XX-XX-XX-XX-XX-XX）
   - 广播IP地址：WOL广播地址（例如：192.168.31.255）
   - IP地址：目标PC的IP地址
   - 用户名：SSH登录用户名
   - 密码：SSH登录密码

3. **日志功能**
   - 实时显示系统消息
   - 按类型筛选日志（信息、成功、错误）
   - 搜索日志内容
   - 清空日志记录
   - 日志持久化存储

## MQTT消息协议

### 唤醒PC

发送消息：`on`

系统会发送10次WOL幻数据包到目标PC的MAC地址。

### 关闭PC

发送消息：`off`

系统会通过SSH连接到目标PC并执行关机命令。

## 文件结构

```
WOL/
├── main.py              # 主程序文件
├── open.py             # WOL唤醒功能
├── shutdown.py          # 远程关机功能
├── config.json          # 客户端配置文件
├── Dockerfile           # Docker镜像构建文件
├── .dockerignore       # Docker构建忽略文件
├── requirements.txt      # Python依赖列表
├── web/                # Web界面文件
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── script.js       # JavaScript逻辑
└── README.md           # 项目说明文档
```

## Docker镜像导出

如果需要将Docker镜像导出为tar文件并在其他机器部署：

```bash
# 保存镜像为tar文件
docker save -o wol-project.tar wol-project

# 传输到目标机器
scp wol-project.tar user@remote-host:/path/to/destination

# 在目标机器加载镜像
docker load -i wol-project.tar

# 运行容器
docker run -p 18808:18808 wol-project
```

## 注意事项

1. **网络安全**
   - 确保局域网环境安全
   - 使用强密码保护SSH登录
   - 限制MQTT主题的访问权限

2. **网络配置**
   - 确保目标PC已启用WOL功能
   - 确保目标PC的防火墙允许WOL数据包（UDP端口9）
   - 确保目标PC的SSH端口（默认22）已开放

3. **数据备份**
   - 定期备份 `config.json` 文件
   - 使用Docker卷或绑定挂载持久化配置数据

4. **性能优化**
   - Docker镜像使用 `--no-cache-dir` 参数减少镜像大小
   - 使用 `.dockerignore` 文件排除不必要的文件
   - 使用轻量级基础镜像（python:3.12-slim）

## 故障排除

### 问题1：无法唤醒PC

- 检查MAC地址是否正确
- 检查广播IP地址是否正确
- 确保目标PC已启用WOL功能
- 检查网络连接

### 问题2：无法关闭PC

- 检查IP地址是否正确
- 检查用户名和密码是否正确（需本地账户）
- 确保目标PC的SSH服务已启动
- 检查网络连接

### 问题3：Web界面无法访问

- 检查18808端口是否被占用
- 检查防火墙设置
- 检查Docker容器是否正常运行

## 许可证

本项目仅供学习和个人使用，请勿用于商业用途。

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件

## 更新日志

### v1.0.0 (2026-02-06)
- 初始版本发布
- 实现WOL远程唤醒功能
- 实现远程关机功能
- 实现Web配置界面
- 实现日志记录功能
- 支持多客户端管理
- 支持Docker部署
- 支持双线程运行