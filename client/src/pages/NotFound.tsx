import React from "react"
import { Link } from "react-router-dom"

const NotFound: React.FC = () => {
	return (
		<div style={{ padding: 24 }}>
			<h1>404</h1>
			<p>Page not found.</p>
			<p>
				<Link to="/">Go Home</Link>
			</p>
		</div>
	)
}

export default NotFound


