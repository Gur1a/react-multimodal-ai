import React from "react"
import { WsClient, type WsEvent } from "@/services/wsClient"
import "./Realtime.css"

const Realtime: React.FC = () => {
	const [connected, setConnected] = React.useState(false)
	const [messages, setMessages] = React.useState<string[]>([])
	const wsRef = React.useRef<WsClient | null>(null)

	const connect = () => {
		const ws = new WsClient({ url: "wss://echo.websocket.events" })
		wsRef.current = ws
		ws.on((e: WsEvent) => {
			if (e.type === "open") setConnected(true)
			if (e.type === "close") setConnected(false)
			if (e.type === "message") setMessages((m) => [...m, JSON.stringify(e.data)])
		})
		ws.connect()
	}

	const disconnect = () => {
		wsRef.current?.close()
		setConnected(false)
	}

	const sendPing = () => {
		wsRef.current?.send({ type: "ping", at: Date.now() })
	}

	return (
		<div className="realtime-container">
			<h1>Realtime</h1>
			<p>Status: {connected ? "Connected" : "Disconnected"}</p>
			<div className="realtime-actions">
				<button onClick={connect} disabled={connected}>Connect</button>
				<button onClick={disconnect} disabled={!connected}>Disconnect</button>
				<button onClick={sendPing} disabled={!connected}>Send</button>
			</div>
			<pre className="realtime-log">
				{messages.join("\n")}
			</pre>
		</div>
	)
}

export default Realtime


