import React from "react"
import { createRoot } from "react-dom/client"
import RouterRoot from "@/routers/index"

const container = document.getElementById("root") as HTMLElement
const root = createRoot(container)
root.render(
	<React.StrictMode>
		<RouterRoot />
	</React.StrictMode>
)


