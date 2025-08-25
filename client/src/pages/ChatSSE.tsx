import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import { Input, Button, Avatar, Spin } from 'antd';
import { throttle } from 'lodash-es';
import './ChatSSE.css';

interface Message {
    content: string;
    isUser: boolean;
    timestamp: number;
    isStreaming?: boolean;
}

const Chat: React.FC = () => {
    //输入数据
    const [input, setInput] = useState('');
    //对话问答数据
    const [messages, setMessages] = useState<Message[]>([]);
    //loading
    const [isProcessing, setIsProcessing] = useState(false);
    //打字标
    const messagesEndRef = useRef<HTMLDivElement>(null);

    //滚动到底部-采用lodash-es节流
    const scrollToBottom = throttle(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 400);

    const disposeReplay = (replay: Uint8Array): string => {
        return new TextDecoder().decode(replay).replace(/(\r?\n|\r| )|data:/g, "");
    };



    /**
     * 原生fetch获取回复
     * 注意：fetch是天然支持sse的
     */
    const fetchStreamAI = async () => {
        setIsProcessing(true);

        try {
            const aiMessage: Message = {
                content: '',
                isUser: false,
                timestamp: Date.now() + 1000,
                isStreaming: true,
            };
            setMessages(prev => [...prev, aiMessage]);

            const resp = await fetch('http://nest.liboscrg.com/prod/card/getContentAI?content=' + input, {
                method: "GET",
                // 允许携带cookies，需要服务端允许跨域请求
                // credentials: 'include',
            });

            const reader = resp.body?.getReader();
            if (!reader) throw new Error('Failed to get reader');

            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    setMessages(prev => prev.map(msg => {
                        return msg.timestamp === aiMessage.timestamp
                            ? { ...msg, isStreaming: false }
                            : msg
                    }));

                    break;
                };
                const text = disposeReplay(value);

                accumulatedContent += text;
                //同步更新消息
                setMessages(prev => prev.map(msg => {
                        return msg.timestamp === aiMessage.timestamp
                            ? { ...msg, content: accumulatedContent }
                            : msg
                    }
                ));
                scrollToBottom();
            }

        } catch (error) {
            console.error('Error getting AI response:', error);
        } finally {
            setIsProcessing(false);
        }
    }

    //发送
    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const userMessage: Message = {
            content: input,
            isUser: true,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // 调用SSE进行通信
        await fetchStreamAI()
    };

    const handleClearHistory = () => {
        setMessages([]);
    };

    return (
        <div className="chatContainer">
            <div className="messageList">
                {messages.map((message) => (
                    <div key={message.timestamp} className={`messageItem ${message.isUser ? "isUser" : ''}`}>
                        <Avatar
                            size={40}
                            src={message.isUser ? '/user-avatar.png' : '/ai-avatar.png'}
                            style={{ backgroundColor: message.isUser ? '#1890ff' : '#87d068' }}
                        >
                            {message.isUser ? 'U' : 'AI'}
                        </Avatar>
                        <div className="messageContent">
                            {message.content}
                            {message.isStreaming && <span className="cursor">|</span>}
                        </div>
                    </div>
                ))}
                {isProcessing && !messages[messages.length - 1]?.isStreaming && (
                    <div className="messageItem">
                        <Avatar size={40} style={{ backgroundColor: '#87d068' }}>AI</Avatar>
                        <div className="messageContent">
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="inputContainer">
                <Button
                    icon={<DeleteOutlined />}
                    onClick={handleClearHistory}
                    style={{ marginRight: '10px' }}
                />
                <Input.TextArea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPressEnter={(e) => {
                        if (!e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="输入消息，按Enter发送，Shift+Enter换行"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1 }}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={isProcessing}
                />
            </div>
        </div>
    );
};

export default Chat;