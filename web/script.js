// 客户端配置数据
let clients = [];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载客户端配置数据
    loadClients();
    
    // 添加客户端按钮点击事件
    document.getElementById('add-client').addEventListener('click', addNewClient);
});

// 加载客户端配置数据
async function loadClients() {
    try {
        // 显示加载状态
        showLoading('加载配置数据中...');
        
        // 从后端API获取配置数据
        const response = await fetch('/api/config');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        clients = data.clients || [];
        
        // 生成客户端配置面板
        renderClients();
        
        // 隐藏加载状态
        hideLoading();
    } catch (error) {
        console.error('加载配置数据失败:', error);
        // 隐藏加载状态
        hideLoading();
        // 显示错误提示
        showAlert('加载配置数据失败，请刷新页面重试', 'danger');
    }
}

// 显示加载状态
function showLoading(message = '加载中...') {
    // 检查是否已存在加载指示器
    let loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) {
        // 创建加载指示器
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>${message}</p>
        `;
        document.body.appendChild(loadingIndicator);
    } else {
        // 更新加载消息
        loadingIndicator.querySelector('p').textContent = message;
    }
    
    // 显示加载指示器
    loadingIndicator.style.display = 'flex';
}

// 隐藏加载状态
function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 生成客户端配置面板
function renderClients() {
    const clientList = document.getElementById('client-list');
    clientList.innerHTML = '';
    
    clients.forEach((client, index) => {
        const clientPanel = createClientPanel(client, index);
        clientList.appendChild(clientPanel);
    });
}

// 创建客户端配置面板
function createClientPanel(client, index) {
    const panel = document.createElement('div');
    panel.className = 'client-panel';
    panel.dataset.index = index;
    
    // 面板头部
    const panelHeader = document.createElement('div');
    panelHeader.className = 'panel-header';
    panelHeader.innerHTML = `
        <h3>${client.topic}</h3>
        <div class="header-actions">
            <button class="btn btn-danger delete-client">删除</button>
        </div>
    `;
    
    // 面板内容
    const panelContent = document.createElement('div');
    panelContent.className = 'panel-content';
    
    // 表单
    const form = document.createElement('form');
    form.className = 'client-form';
    form.innerHTML = `
        <div class="form-group">
            <label for="topic-${index}">Topic</label>
            <input type="text" id="topic-${index}" name="topic" value="${client.topic}" required>
        </div>
        
        <div class="form-group">
            <label for="target_mac-${index}">MAC地址</label>
            <input type="text" id="target_mac-${index}" name="target_mac" value="${client.target_mac}" required>
            <div class="error-message"></div>
        </div>
        
        <div class="form-group">
            <label for="broadcast_ip-${index}">广播IP地址</label>
            <input type="text" id="broadcast_ip-${index}" name="broadcast_ip" value="${client.broadcast_ip}" required>
            <div class="error-message"></div>
        </div>
        
        <div class="form-group">
            <label for="ip-${index}">IP地址</label>
            <input type="text" id="ip-${index}" name="ip" value="${client.ip}" required>
            <div class="error-message"></div>
        </div>
        
        <div class="form-group">
            <label for="username-${index}">用户名</label>
            <input type="text" id="username-${index}" name="username" value="${client.username}" required>
        </div>
        
        <div class="form-group">
            <label for="password-${index}">密码</label>
            <div class="password-container">
                <input type="password" id="password-${index}" name="password" value="${client.password}" required>
                <span class="password-toggle" data-target="password-${index}">显示</span>
            </div>
        </div>
        
        <div class="form-actions">
            <button type="button" class="btn btn-secondary cancel-edit">取消</button>
            <button type="submit" class="btn btn-primary save-client">保存</button>
        </div>
        
        <div class="alert-container"></div>
    `;
    
    panelContent.appendChild(form);
    panel.appendChild(panelHeader);
    panel.appendChild(panelContent);
    
    // 绑定事件
    bindPanelEvents(panel, index);
    
    return panel;
}

// 绑定面板事件
function bindPanelEvents(panel, index) {
    const panelHeader = panel.querySelector('.panel-header');
    const panelContent = panel.querySelector('.panel-content');
    const form = panel.querySelector('.client-form');
    const deleteBtn = panel.querySelector('.delete-client');
    const cancelBtn = panel.querySelector('.cancel-edit');
    const saveBtn = panel.querySelector('.save-client');
    const passwordToggle = panel.querySelector('.password-toggle');
    
    // 面板展开/折叠事件
    panelHeader.addEventListener('click', function(e) {
        // 避免点击按钮时触发展开/折叠
        if (!e.target.closest('button')) {
            panelHeader.classList.toggle('active');
            panelContent.classList.toggle('active');
        }
    });
    
    // 删除客户端事件
    deleteBtn.addEventListener('click', function() {
        if (confirm('确定要删除这个客户端吗？')) {
            clients.splice(index, 1);
            renderClients();
            saveConfig();
        }
    });
    
    // 取消编辑事件
    cancelBtn.addEventListener('click', function() {
        // 重新加载客户端数据
        loadClients();
    });
    
    // 保存客户端配置事件
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 表单验证
        if (validateForm(form, index)) {
            // 获取表单数据
            const formData = new FormData(form);
            const clientData = {
                topic: formData.get('topic'),
                target_mac: formData.get('target_mac'),
                broadcast_ip: formData.get('broadcast_ip'),
                ip: formData.get('ip'),
                username: formData.get('username'),
                password: formData.get('password')
            };
            
            // 更新客户端数据
            clients[index] = clientData;
            
            // 保存配置
            saveConfig(form);
        }
    });
    
    // 密码显示/隐藏切换事件
    passwordToggle.addEventListener('click', function() {
        const passwordInput = document.getElementById(passwordToggle.dataset.target);
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordToggle.textContent = '隐藏';
        } else {
            passwordInput.type = 'password';
            passwordToggle.textContent = '显示';
        }
    });
}

// 添加新客户端
function addNewClient() {
    const newClient = {
        topic: `new-client-${Date.now()}`,
        target_mac: '',
        broadcast_ip: '',
        ip: '',
        username: '',
        password: ''
    };
    
    clients.push(newClient);
    renderClients();
    
    // 自动展开新添加的客户端面板
    const clientPanels = document.querySelectorAll('.client-panel');
    const newPanel = clientPanels[clientPanels.length - 1];
    const newPanelHeader = newPanel.querySelector('.panel-header');
    const newPanelContent = newPanel.querySelector('.panel-content');
    
    newPanelHeader.classList.add('active');
    newPanelContent.classList.add('active');
    
    // 聚焦到topic输入框
    const topicInput = newPanel.querySelector('input[name="topic"]');
    topicInput.focus();
}

// 表单验证
function validateForm(form, index) {
    let isValid = true;
    
    // 重置错误提示
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    form.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    
    // MAC地址验证
    const macInput = form.querySelector('input[name="target_mac"]');
    const macValue = macInput.value.trim();
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    
    if (!macPattern.test(macValue)) {
        isValid = false;
        macInput.classList.add('error');
        macInput.nextElementSibling.textContent = 'MAC地址格式错误，应为XX-XX-XX-XX-XX-XX或XX:XX:XX:XX:XX:XX';
    }
    
    // IP地址验证（广播IP和普通IP）
    const ipInputs = [
        form.querySelector('input[name="broadcast_ip"]'),
        form.querySelector('input[name="ip"]')
    ];
    
    ipInputs.forEach(ipInput => {
        const ipValue = ipInput.value.trim();
        const ipPattern = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        
        if (!ipPattern.test(ipValue)) {
            isValid = false;
            ipInput.classList.add('error');
            ipInput.nextElementSibling.textContent = 'IP地址格式错误';
        }
    });
    
    return isValid;
}

// 保存配置
async function saveConfig(form = null) {
    try {
        // 显示加载状态
        showLoading('保存配置中...');
        
        // 发送配置数据到后端API
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clients })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // 隐藏加载状态
        hideLoading();
        
        if (result.success) {
            // 记录配置保存成功事件到日志
            if (logManager) {
                logManager.addLog('配置保存成功', 'success', 'config');
            }
            
            // 显示成功提示
            if (form) {
                const alertContainer = form.querySelector('.alert-container');
                alertContainer.innerHTML = '<div class="alert alert-success">保存成功！</div>';
                
                // 3秒后移除提示
                setTimeout(() => {
                    alertContainer.innerHTML = '';
                }, 3000);
            }
        } else {
            // 记录配置保存失败事件到日志
            if (logManager) {
                logManager.addLog(`配置保存失败: ${result.message || '未知错误'}`, 'error', 'config');
            }
            
            // 显示失败提示
            if (form) {
                const alertContainer = form.querySelector('.alert-container');
                alertContainer.innerHTML = '<div class="alert alert-danger">保存失败：' + (result.message || '未知错误') + '</div>';
            }
        }
    } catch (error) {
        console.error('保存配置失败:', error);
        
        // 隐藏加载状态
        hideLoading();
        
        // 记录配置保存失败事件到日志
        if (logManager) {
            logManager.addLog(`配置保存失败: ${error.message}`, 'error', 'config');
        }
        
        // 显示失败提示
        if (form) {
            const alertContainer = form.querySelector('.alert-container');
            alertContainer.innerHTML = '<div class="alert alert-danger">保存失败：网络错误</div>';
        }
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    // 3秒后移除提示
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// 日志管理功能
class LogManager {
    constructor() {
        this.logContainer = document.getElementById('log-container');
        this.logSearch = document.getElementById('log-search');
        this.logFilter = document.getElementById('log-filter');
        this.clearLogsBtn = document.getElementById('clear-logs');
        
        // 初始化日志管理
        this.init();
    }
    
    // 初始化
    init() {
        // 加载本地存储的日志
        this.loadLogs();
        
        // 绑定事件监听器
        this.bindEvents();
    }
    
    // 绑定事件监听器
    bindEvents() {
        // 搜索框输入事件
        if (this.logSearch) {
            this.logSearch.addEventListener('input', () => this.filterLogs());
        }
        
        // 筛选下拉框变化事件
        if (this.logFilter) {
            this.logFilter.addEventListener('change', () => this.filterLogs());
        }
        
        // 清空日志按钮点击事件
        if (this.clearLogsBtn) {
            this.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        }
        
        // 启动日志轮询
        this.startLogPolling();
    }
    
    // 启动日志轮询
    startLogPolling() {
        // 每2秒从后端获取一次日志消息
        setInterval(() => this.fetchLogs(), 2000);
    }
    
    // 从后端获取日志消息
    async fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const logs = data.logs || [];
            
            // 添加后端日志消息
            logs.forEach(log => {
                // 格式化时间戳
                const date = new Date(log.timestamp * 1000);
                const formattedTime = date.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                // 创建日志对象
                const logObject = {
                    id: log.timestamp.toString(),
                    timestamp: date.toISOString(),
                    message: log.message,
                    type: log.type,
                    source: log.source
                };
                
                // 添加到本地存储
                const existingLogs = this.getLogs();
                existingLogs.push(logObject);
                this.saveLogs(existingLogs);
                
                // 渲染日志
                this.renderLog(logObject);
            });
            
            // 滚动到最新日志
            if (logs.length > 0) {
                this.scrollToLatest();
            }
        } catch (error) {
            console.error('获取日志消息失败:', error);
        }
    }
    
    // 添加日志
    addLog(message, type = 'info', source = 'system') {
        // 创建日志对象
        const log = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            message: message,
            type: type,
            source: source
        };
        
        // 获取现有日志
        const logs = this.getLogs();
        
        // 添加新日志
        logs.push(log);
        
        // 保存到本地存储
        this.saveLogs(logs);
        
        // 渲染日志
        this.renderLog(log);
        
        // 滚动到最新日志
        this.scrollToLatest();
    }
    
    // 渲染单条日志
    renderLog(log) {
        if (!this.logContainer) return;
        
        // 创建日志条目元素
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${log.type}`;
        logEntry.dataset.id = log.id;
        logEntry.dataset.type = log.type;
        
        // 格式化时间戳
        const date = new Date(log.timestamp);
        const formattedTime = date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 设置日志条目内容
        logEntry.innerHTML = `
            <div class="log-timestamp">${formattedTime}</div>
            <div class="log-content">
                <div class="log-message">${log.message}</div>
                <div class="log-source">${log.source}</div>
            </div>
        `;
        
        // 添加到日志容器
        this.logContainer.appendChild(logEntry);
    }
    
    // 加载所有日志
    loadLogs() {
        if (!this.logContainer) return;
        
        // 清空现有日志
        this.logContainer.innerHTML = '';
        
        // 获取本地存储的日志
        const logs = this.getLogs();
        
        // 渲染所有日志
        logs.forEach(log => this.renderLog(log));
        
        // 滚动到最新日志
        this.scrollToLatest();
    }
    
    // 滚动到最新日志
    scrollToLatest() {
        if (this.logContainer) {
            this.logContainer.scrollTop = this.logContainer.scrollHeight;
        }
    }
    
    // 清空日志
    clearLogs() {
        if (confirm('确定要清空所有日志记录吗？')) {
            // 清空本地存储
            localStorage.removeItem('wol_logs');
            
            // 清空日志容器
            if (this.logContainer) {
                this.logContainer.innerHTML = '';
            }
            
            // 显示提示
            showAlert('日志已清空', 'success');
        }
    }
    
    // 筛选日志
    filterLogs() {
        if (!this.logContainer) return;
        
        const searchTerm = this.logSearch ? this.logSearch.value.toLowerCase() : '';
        const filterType = this.logFilter ? this.logFilter.value : 'all';
        
        // 获取所有日志条目
        const logEntries = this.logContainer.querySelectorAll('.log-entry');
        
        // 筛选日志条目
        logEntries.forEach(entry => {
            const logMessage = entry.querySelector('.log-message').textContent.toLowerCase();
            const logType = entry.dataset.type;
            
            const matchesSearch = logMessage.includes(searchTerm);
            const matchesFilter = filterType === 'all' || logType === filterType;
            
            if (matchesSearch && matchesFilter) {
                entry.style.display = 'block';
            } else {
                entry.style.display = 'none';
            }
        });
    }
    
    // 获取日志
    getLogs() {
        try {
            const logs = localStorage.getItem('wol_logs');
            return logs ? JSON.parse(logs) : [];
        } catch (error) {
            console.error('获取日志失败:', error);
            return [];
        }
    }
    
    // 保存日志
    saveLogs(logs) {
        try {
            localStorage.setItem('wol_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('保存日志失败:', error);
        }
    }
}

// 初始化日志管理器
let logManager;
document.addEventListener('DOMContentLoaded', function() {
    // 初始化日志管理器
    logManager = new LogManager();
    
    // 添加测试日志
    logManager.addLog('系统配置页面已加载', 'info', 'system');
});

// 导出日志管理器实例
window.logManager = logManager;
