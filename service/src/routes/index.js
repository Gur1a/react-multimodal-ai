'use strict'

const { Router } = require('express')
const healthRoutes = require('./health.routes')
const chatRoutes = require('./chat.routes')
const historyRoutes = require('./history.routes')

const router = Router()

// 统一挂载 /api 前缀
router.use('/api', healthRoutes)
router.use('/api', chatRoutes)
router.use('/api', historyRoutes)

module.exports = router