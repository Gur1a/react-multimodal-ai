'use strict'

const { Router } = require('express')
const ctrl = require('../controllers/history.controller')

const router = Router()

router.post('/conversations', ctrl.createConversation)
router.get('/conversations', ctrl.listConversations)
router.post('/conversations/:conversationId/messages', ctrl.addMessage)
router.get('/conversations/:conversationId/messages', ctrl.listMessages)

module.exports = router


