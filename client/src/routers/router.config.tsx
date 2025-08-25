import React, { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'

const HomePage = lazy(() => import('@/pages/Home'))
const AboutPage = lazy(() => import('@/pages/About'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))
const RealtimePage = lazy(() => import('@/pages/Realtime'))
const ChatPage = lazy(() => import('@/pages/Chat'))
const ChatSSE = lazy(()=> import('@/pages/ChatSSE'))

const withSuspense = (element: React.ReactElement) =>
	React.createElement(
		Suspense,
		{ fallback: React.createElement('div', null, 'Loading...') },
		element
	)

/**
 * 基于配置的路由表，供 useRoutes 使用
 */
const routes: RouteObject[] = [
	{
		path: '/',
		element: withSuspense(React.createElement(HomePage)),
	},
	{
		path: '/about',
		element: withSuspense(React.createElement(AboutPage)),
	},
	{
		path: '/realtime',
		element: withSuspense(React.createElement(RealtimePage)),
	},
	{
		path: '/chat',
		element: withSuspense(React.createElement(ChatPage)),
	},
	{
		path: '*',
		element: withSuspense(React.createElement(NotFoundPage)),
	},
	{
		path: '/chatSSE',
		element: withSuspense(React.createElement(ChatSSE)),
	}
]

export default routes

