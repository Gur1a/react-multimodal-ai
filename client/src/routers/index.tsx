import React from "react"
import { BrowserRouter, useRoutes } from "react-router-dom"
import routesConfig from "@/routers/router.config"

const MainRoutes: React.FC = () => {
	const element = useRoutes(routesConfig)
	return element
}

const RouterRoot: React.FC = () => {
	return (
		<BrowserRouter>
			<MainRoutes />
		</BrowserRouter>
	)
}

export default RouterRoot


