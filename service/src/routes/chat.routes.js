'use strict'

const { Router } = require('express')
const { chat } = require('../controllers/chat.controller')
const ctrl = require('../controllers/chat.controller')

const router = Router()

router.get('/chat', ctrl.chat)

module.exports = router


