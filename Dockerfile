# 使用Python 3.12作为基础镜像
FROM python:3.12-slim

# 设置工作目录
WORKDIR /app

# 复制项目文件到工作目录
COPY . /app

# 安装项目依赖
RUN pip install --no-cache-dir paho-mqtt paramiko

# 暴露端口（如果需要）
EXPOSE 18808

# 设置环境变量
ENV PYTHONUNBUFFERED=1

# 启动命令
CMD ["python", "main.py"]