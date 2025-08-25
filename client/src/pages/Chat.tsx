import React, {useEffect, useRef, useState} from "react"
import { throttle } from 'lodash-es';
import "./Chat.css"

type ChatMessage = {
	id: string
	role: "user" | "assistant"
	text: string
	images?: string[]
	isStreaming?: boolean
}

const Chat: React.FC = () => {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [text, setText] = useState("")
	const [images, setImages] = useState<string[]>([])
	const [processing, setProcessing] = useState(false)
	const [conversationId, setConversationId] = useState<number | null>(null)
	const [activeTypingId, setActiveTypingId] = useState<string | null>(null) // 当前正在输入的消息ID
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatBoxRef = useRef<HTMLDivElement>(null);

	const onSelectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files
		if (!files || files.length === 0) return
		const readers = Array.from(files).map((file) =>
			new Promise<string>((resolve) => {
				const reader = new FileReader()
				reader.onload = () => resolve(String(reader.result))
				reader.readAsDataURL(file)
			})
		)
		const urls = await Promise.all(readers)
		setImages((prev) => [...prev, ...urls])
		e.target.value = ""
	}

	const scrollToBottom = throttle(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, 400);

	const eventSourceAI = async (payload: string) => {
		try {
			setProcessing(true);
			
			// 创建AI消息 - 采用ChatSSE成功模式
			const msgId = crypto.randomUUID();
			const aiMessage: ChatMessage = {
				id: msgId,
				role: "assistant",
				text: "",
				isStreaming: true // 添加流式状态
			};
			
			setMessages(prev => [...prev, aiMessage]);
			setActiveTypingId(msgId);
			
			const eventSource = new EventSource(`/api/chat?payload=${payload}`);
			let accumulatedContent = ''; // 累积内容
			let updateQueue: string[] = []; // 更新队列
			let isProcessingQueue = false; // 队列处理状态
			let lastUpdateTime = Date.now(); // 记录上次更新时间
			
			// 处理更新队列的函数
			const processUpdateQueue = async () => {
				if (isProcessingQueue || updateQueue.length === 0) return;
				
				isProcessingQueue = true;
				
				while (updateQueue.length > 0) {
					const delta = updateQueue.shift()!;
					const hasMoreTokens = updateQueue.length > 0; // 在处理前检查是否还有更多token
					
					accumulatedContent += delta;
					
					const currentTime = Date.now();
					const timeSinceLastUpdate = currentTime - lastUpdateTime;
					
					console.log(`🕐 [${new Date().toLocaleTimeString()}] 更新消息:`, {
						delta: delta,
						currentContent: accumulatedContent,
						timeSinceLastUpdate: `${timeSinceLastUpdate}ms`,
						hasMoreTokens: hasMoreTokens,
						remainingInQueue: updateQueue.length
					});
					
					// 更新React状态
					setMessages(prev => prev.map(msg =>
						msg.id === msgId
							? { ...msg, text: accumulatedContent }
							: msg
					));
					
					scrollToBottom();
					lastUpdateTime = Date.now(); // 在延迟后更新时间
					
					// 关键修复：只要不是最后一个token就延迟
					if (hasMoreTokens) {
						console.log(`⏱️  等待150ms后继续下一个token... (还剩${updateQueue.length}个)`);
						await new Promise(resolve => setTimeout(resolve, 10));
						console.log(`✅ 延迟完成，继续处理下一个token`);
					} else {
						console.log(`🏁 这是最后一个token，无需延迟`);
					}
				}
				
				isProcessingQueue = false;
				console.log(`🔄 队列处理完成`);
			};
			
			eventSource.onmessage = async (event) => {
				try {
					const data = JSON.parse(event.data);
					const receiveTime = new Date().toLocaleTimeString();
					
					if (data.delta) {
						console.log(`📨 [${receiveTime}] 接收到delta:`, data.delta, `当前队列长度: ${updateQueue.length}`);
						
						// 将delta添加到更新队列
						updateQueue.push(data.delta);
						
						// 只有在队列没有正在处理时才启动处理
						if (!isProcessingQueue) {
							console.log(`🚀 开始处理队列，当前队列长度: ${updateQueue.length}`);
							// 等待100ms让更多的tokens积累到队列中，然后开始处理
							setTimeout(() => {
								processUpdateQueue();
							}, 100);
						} else {
							console.log(`⏳ 队列正在处理中，等待...当前队列长度: ${updateQueue.length}`);
						}
						
					} else if (data.done) {
						console.log(`✅ [${receiveTime}] 流式响应完成，最终内容长度:`, accumulatedContent.length);
						
						// 等待队列处理完成
						const waitStart = Date.now();
						while (isProcessingQueue || updateQueue.length > 0) {
							console.log(`⏳ 等待队列处理完成... 剩余: ${updateQueue.length}, 正在处理: ${isProcessingQueue}`);
							await new Promise(resolve => setTimeout(resolve, 50));
						}
						const waitTime = Date.now() - waitStart;
						console.log(`✅ 队列处理完成，等待时间: ${waitTime}ms`);
						
						// 完成流式输入，移除流式状态
						setActiveTypingId(null);
						setMessages(prev => prev.map(msg =>
							msg.id === msgId
								? { ...msg, isStreaming: false }
								: msg
						));
						
						eventSource.close();
						setProcessing(false);
						
						console.log(`🏁 [${new Date().toLocaleTimeString()}] 打字机效果完成`);
						
						// 保存助手消息到数据库
						if (conversationId && accumulatedContent) {
							await fetch(`/api/conversations/${conversationId}/messages`, {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ role: 'assistant', content: accumulatedContent }),
							});
						}
						
					} else if (data.error) {
						console.error(`❌ [${receiveTime}] Error:`, data.error);
						setActiveTypingId(null);
						eventSource.close();
						setProcessing(false);
					}
					
				} catch (err) {
					console.error('Parse error:', err);
				}
			};
			
			eventSource.onerror = (err) => {
				console.error('EventSource error:', err);
				setActiveTypingId(null);
				eventSource.close();
				setProcessing(false);
			};
			
		} catch (error) {
			console.error(error);
			setActiveTypingId(null);
			setProcessing(false);
		}
	}

	const onSend = async () => {
		if (!text.trim() && images.length === 0) return
		if (processing) return // 防止重复发送

		// 用户输入
		const userMsg: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			text: text.trim(),
			images,
		}
		setMessages((prev) => [...prev, userMsg])
		setImages([])
		setText("")

		const payload = encodeURIComponent(JSON.stringify({
			text: userMsg.text,
			images: userMsg.images
		}));

		// 确保会话ID存在
		let convId = conversationId
		if (!convId) {
			const res = await fetch('/api/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: userMsg.text }),
			})
			const conv = await res.json()
			convId = conv.id
			setConversationId(convId)
		}
		
		// 立即存用户消息
		await fetch(`/api/conversations/${convId}/messages`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role: 'user', content: userMsg.text, images: userMsg.images }),
		})

		// 开始AI流式响应
		await eventSourceAI(payload)
	}

	const removePreview = (idx: number) => {
		setImages((prev) => prev.filter((_, i) => i !== idx))
	}




	return (
		<div className="chat-container">
			<h1>Chat</h1>
			<div className="chat-box" ref={chatBoxRef}>
				{messages.map((m) => {
					const isCurrentlyTyping = m.id === activeTypingId;
					
					return (
						<div key={m.id} className={`chat-message ${m.isStreaming ? 'typing' : ''}`} data-role={m.role}>
							<div className="chat-role">{m.role === "user" ? "你" : "助手"}</div>
							<div className="chat-text">
								{m.text}
								{m.isStreaming && <span className="cursor">|</span>}
							</div>
							{m.images && m.images.length > 0 && (
								<div className="chat-images" style={{marginTop: 8}}>
									{m.images.map((src, idx) => (
										<img key={idx} src={src} alt="upload" className="chat-image"/>
									))}
								</div>
							)}
						</div>
					)
				})}
				<div ref={messagesEndRef}/>
			</div>
			<div className="chat-input-area">
				<textarea
					placeholder="输入消息..."
					value={text}
					onChange={(e) => setText(e.target.value)}
					rows={3}
					className="chat-textarea"
					disabled={processing}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey && !processing) {
							e.preventDefault();
							onSend();
						}
					}}
				/>
				<div className="chat-actions">
					<label className="chat-upload-label">
						<input type="file" multiple accept="image/*" onChange={onSelectImages}
							   style={{display: "none"}} disabled={processing}/>
						<span className={`chat-upload-btn ${processing ? 'disabled' : ''}`}>上传图片</span>
					</label>
					<button onClick={onSend} className="chat-send-btn" disabled={processing}>
						{processing ? '发送中...' : '发送'}
					</button>
				</div>
				{images.length > 0 && (
					<div className="chat-preview-list">
						{images.map((src, idx) => (
							<div key={idx} className="chat-preview-item">
								<img src={src} alt="preview" className="chat-preview-image" />
								<button type="button" className="chat-img-delete" onClick={() => removePreview(idx)}>×</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default Chat


