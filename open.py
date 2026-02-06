import socket
import struct



def send_wol_packet(mac_address, broadcast_ip):
    """
    发送幻数据包（Magic Packet）以实现WOL功能。
    
    :param mac_address: 目标PC的MAC地址，格式为"XX-XX-XX-XX-XX-XX"或"XX:XX:XX:XX:XX:XX"
    :param broadcast_ip: 广播地址，例如"192.168.31.255"
    """
    # 去掉MAC地址中的分隔符
    mac_address = mac_address.replace("-", "").replace(":", "").upper()

    # 检查MAC地址格式是否正确
    if len(mac_address) != 12:
        raise ValueError("MAC地址格式错误，应为12个十六进制字符（不含分隔符）")
    print(f"目标MAC地址：{mac_address}")
    # 将MAC地址转为字节格式
    mac_bytes = bytes.fromhex(mac_address)

    # 构建幻数据包：6字节的0xFF + 16次MAC地址重复
    magic_packet = b'\xFF' * 6 + mac_bytes * 16

    # 使用UDP广播发送幻数据包
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)  # 启用广播
        sock.sendto(magic_packet, (broadcast_ip, 9))  # 端口9是标准WOL端口
        print(f"正在通过广播地址 {broadcast_ip} 发送幻数据包...")
        print(f"Magic Packet: {magic_packet.hex()}")

    print(f"幻数据包已发送至广播地址 {broadcast_ip}，目标MAC地址：{mac_address}")

if __name__ == "__main__":
    target_mac = "60-CF-84-E8-63-93"
    broadcast_ip = "192.168.31.255"
    # target_mac = "E8-9C-25-A3-03-28"
    # broadcast_ip = "192.168.31.255"
    
    send_wol_packet(target_mac, broadcast_ip)