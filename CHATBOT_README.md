# Chatbot Documentation - TMDT汽车租赁平台

## 概述

聊天机器人是一个智能客服系统，帮助用户：
- 查询租车信息
- 了解价格和车型
- 预订车辆
- 获取联系方式
- 查看订单状态

## 功能特性

### 1. 聊天机器人功能
- **自动问候**：新会话自动发送欢迎消息
- **智能回复**：基于规则的自动回复系统
- **快速回复**：提供预设选项供用户选择
- **多会话类型**：支持咨询、预订、投诉等不同场景
- **消息历史**：保存完整的聊天记录
- **深色模式**：完美适配网站深色主题

### 2. 支持的查询类型
- 问候语（xin chào, hello, hi）
- 租车信息（thuê xe, cho thuê）
- 价格查询（giá, price, chi phí）
- 车型信息（xe, car, ô tô）
- 预订流程（đặt xe, booking）
- 订单查询（đơn hàng, order）
- 联系方式（liên hệ, contact）
- 支付方式（thanh toán, payment）
- 取消政策（hủy, cancel）
- 保险信息（bảo hiểm, insurance）

## 项目结构

### 后端 (Django)
```
backend/server/chat/
├── __init__.py
├── apps.py          # App配置
├── admin.py         # Admin管理
├── models.py        # 数据模型
├── serializers.py   # 序列化器
├── urls.py          # URL路由
├── views.py         # 视图逻辑
└── migrations/      # 数据库迁移
    └── 0001_initial.py
```

### 前端 (React)
```
frontend/src/
├── api/
│   └── chatApi.js        # API客户端
├── contexts/
│   └── ChatContext.jsx   # 状态管理
├── components/
│   ├── ChatButton.jsx    # 浮动按钮
│   ├── ChatWindow.jsx    # 聊天窗口
│   └── ChatWidget.jsx    # 组合组件
└── App.jsx               # 集成到主应用
```

## API 端点

### 1. 会话管理
- `POST /api/chat/sessions/` - 创建新会话
- `GET /api/chat/sessions/` - 获取会话列表
- `GET /api/chat/sessions/{session_id}/` - 获取会话详情

### 2. 消息管理
- `GET /api/chat/sessions/{session_id}/messages/` - 获取消息列表
- `POST /api/chat/sessions/{session_id}/messages/` - 发送消息

### 3. 聊天机器人
- `POST /api/chat/sessions/{session_id}/send/` - 直接与机器人对话（规则引擎）
- `POST /api/chat/rag/chat/{session_id}/` - RAG AI聊天（推荐）

### 4. 快速操作
- `GET /api/chat/quick-actions/` - 获取可用的快速操作

### 5. RAG专用端点（NEW!）
- `GET /api/chat/rag/health/` - 健康检查
- `GET /api/chat/rag/index/` - 获取索引状态
- `POST /api/chat/rag/index/` - 重建索引
- `GET /api/chat/rag/search/?q=xxx` - 知识库搜索
- `GET /api/chat/rag/quick-replies/?q=xxx` - 获取快速回复建议
- `POST /api/chat/rag/chat/{session_id}/stream/` - 流式聊天

## 使用方法

### 1. 启动后端
```bash
cd backend/server
python manage.py migrate
python manage.py runserver
```

### 2. 启动前端
```bash
cd frontend
npm install
npm run dev
```

### 3. 运行测试
```bash
python test_chatbot.py
```

## 数据模型

### ChatSession (聊天会话)
| 字段 | 类型 | 描述 |
|------|------|------|
| session_id | CharField | 会话唯一标识 |
| user | ForeignKey | 关联用户（可选） |
| session_type | CharField | 会话类型 |
| is_active | BooleanField | 是否活跃 |
| created_at | DateTimeField | 创建时间 |
| updated_at | DateTimeField | 更新时间 |

### ChatMessage (聊天消息)
| 字段 | 类型 | 描述 |
|------|------|------|
| session | ForeignKey | 关联会话 |
| message_type | CharField | 消息类型 |
| content | TextField | 消息内容 |
| quick_replies | JSONField | 快速回复选项 |
| metadata | JSONField | 附加数据 |
| created_at | DateTimeField | 创建时间 |

## 扩展功能

### 1. 添加AI支持
要集成 OpenAI 或其他 LLM：
1. 在 `views.py` 中添加新的视图
2. 在 `_get_bot_response` 方法中调用 AI API
3. 返回 AI 生成的回答

### 2. 添加WebSocket支持
1. 安装 Django Channels
2. 在 `consumers.py` 中创建实时聊天消费者
3. 更新前端以使用 WebSocket 连接

### 3. 自定义规则
在 `views.py` 的 `_get_bot_response` 方法中：
```python
def _get_bot_response(self, session, user_message):
    message_lower = user_message.lower()
    
    # 添加新的规则
    if 'your_keyword' in message_lower:
        return {
            'content': 'Your custom response',
            'quick_replies': ['Option 1', 'Option 2']
        }
    
    # 默认回复
    return {...}
```

## 截图预览

### 聊天按钮
- 位置：页面右下角
- 样式：蓝色渐变圆形按钮
- 动画：轻微浮动效果
- 通知：未读消息红点提示

### 聊天窗口
- 头部：机器人头像、名称、在线状态
- 消息区：气泡式消息显示
- 快速回复：可点击的标签按钮
- 输入区：文本框和发送按钮

## 技术栈

- **前端**：React + Vite + Tailwind CSS
- **后端**：Django REST Framework
- **数据库**：PostgreSQL/SQLite
- **实时**：Django Channels（可选）

## 注意事项

1. 确保后端已运行
2. 前端会自动创建聊天会话
3. 匿名用户也可以使用聊天机器人
4. 登录用户会关联其会话记录

## 未来改进

- [x] 集成 OpenAI GPT (RAG模式)
- [ ] 添加语音识别
- [ ] 支持图片发送
- [ ] 消息翻译功能
- [ ] 情感分析
- [x] 转人工客服功能

## RAG Chatbot 使用指南（NEW!）

### 1. 环境配置
```bash
# 设置OpenAI API Key
export OPENAI_API_KEY='your-api-key'

# 或者在Windows上
set OPENAI_API_KEY=your-api-key
```

### 2. 安装依赖
```bash
pip install openai tiktoken numpy scikit-learn
```

### 3. 启动服务
```bash
cd backend/server
python manage.py runserver
```

### 4. 运行RAG测试
```bash
python test_rag_chatbot.py
```

### RAG架构说明
```
用户问题 → 向量检索 (Top-K) → 相关上下文 → Prompt构建 → OpenAI API → 回答
```

### 知识库数据
- `backend/server/chat/rag/data/cars.json` - 车辆信息
- `backend/server/chat/rag/data/policies.json` - 租赁政策
- `backend/server/chat/rag/data/faqs.json` - 常见问题

### 日志文件
- `logs/rag_chat.log` - 聊天日志
- `logs/unanswered.log` - 未回答问题日志

