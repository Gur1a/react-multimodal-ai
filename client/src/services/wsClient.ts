export type WsEvent =
	| { type: 'open' }
	| { type: 'close'; code?: number; reason?: string }
	| { type: 'error'; error: Event }
	| { type: 'message'; data: any }

export interface WsClientOptions {
	url: string
	protocols?: string | string[]
	parseJson?: boolean
}

export class WsClient {
	private socket: WebSocket | null = null
	private readonly url: string
	private readonly protocols?: string | string[]
	private readonly parseJson: boolean
	private listeners: Array<(e: WsEvent) => void> = []

	constructor(options: WsClientOptions) {
		this.url = options.url
		this.protocols = options.protocols
		this.parseJson = options.parseJson ?? true
	}

	connect() {
		this.socket = this.protocols
			? new WebSocket(this.url, this.protocols)
			: new WebSocket(this.url)

		this.socket.addEventListener('open', () => this.emit({ type: 'open' }))
		this.socket.addEventListener('close', (ev) =>
			this.emit({ type: 'close', code: ev.code, reason: ev.reason })
		)
		this.socket.addEventListener('error', (err) =>
			this.emit({ type: 'error', error: err })
		)
		this.socket.addEventListener('message', (msg) => {
			let data: any = msg.data
			if (this.parseJson && typeof data === 'string') {
				try {
					data = JSON.parse(data)
				} catch {}
			}
			this.emit({ type: 'message', data })
		})
	}

	send(data: any) {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return
		this.socket.send(this.parseJson ? JSON.stringify(data) : data)
	}

	close() {
		this.socket?.close()
	}

	on(listener: (e: WsEvent) => void) {
		this.listeners.push(listener)
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener)
		}
	}

	private emit(e: WsEvent) {
		for (const l of this.listeners) l(e)
	}
}


