export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number }

export interface ChatRequest {
	text: string
	images?: string[]
}

export interface ChatResponse {
	text: string
}

export interface ChatStreamHandlers {
	onDelta: (delta: string) => void
	onDone?: () => void
	signal?: AbortSignal
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResult<T>> {
	try {
		const resp = await fetch(input, init)
		const isJson = resp.headers.get('content-type')?.includes('application/json')
		const body = isJson ? await resp.json() : await resp.text()
		if (!resp.ok) return { ok: false, error: (body?.message || body || 'Request failed'), status: resp.status }
		return { ok: true, data: body as T }
	} catch (e: any) {
		return { ok: false, error: e?.message || 'Network error' }
	}
}

export const api = {
	// chat: {
	// 	async send(payload: ChatRequest) {
	// 		return request<ChatResponse>('/api/chat', {
	// 			method: 'POST',
	// 			headers: { 'Content-Type': 'application/json' },
	// 			body: JSON.stringify(payload),
	// 		})
	// 	},
	// },
	chat: {
		async send(payload: ChatRequest, handlers: ChatStreamHandlers) {
			const { onDelta, onDone, signal } = handlers
			const resp = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
				body: JSON.stringify(payload),
				signal,
			})

			if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`)
			
			const reader = resp.body.getReader()
			const decoder = new TextDecoder("utf-8")
			let buffer = ""
			let fullResponse = ""
		
			while (true) {
				const { value, done } = await reader.read()
				if (done) break
				buffer += decoder.decode(value, { stream: true })
			
				// 处理SSE格式数据
                while (buffer.includes('\n\n')) {
                    const eventEndIndex = buffer.indexOf('\n\n');
                    const eventData = buffer.substring(0, eventEndIndex);
                    buffer = buffer.substring(eventEndIndex + 2);

                    // 提取data字段
                    const dataMatch = eventData.match(/^data: (.*)$/m);
                    if (!dataMatch) continue;

                    try {
                        const data = JSON.parse(dataMatch[1]);
                        
                        // 处理增量内容
                        if (data.delta) {
							console.log("data:", data.delta)
                            fullResponse += data.delta;
                            onDelta?.(data.delta);
                        }
                        
                        // 处理完成状态
                        if (data.done) {
                            onDone?.();
                            return;
                        }
                        
                        // 处理错误
                        if (data.error) {
                            throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
                        }
                    } catch (err) {
                        console.error('Failed to parse SSE event:', err);
                    }
                }
			}
		},
	},
}


