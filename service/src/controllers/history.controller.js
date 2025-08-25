'use strict'

const conversations = require('../repositories/conversations.repo')
const messages = require('../repositories/messages.repo')

async function createConversation(req, res, next) {
	try {
		const { title } = req.body || {}
		const conv = await conversations.createConversation({ title })
		res.json(conv)
	} catch (e) { next(e) }
}

async function listConversations(req, res, next) {
	try {
		const { limit, offset } = req.query
		const list = await conversations.listConversations({
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
		})
		res.json(list)
	} catch (e) { next(e) }
}

async function addMessage(req, res, next) {
	try {
		const { conversationId } = req.params
		const { role, content, images } = req.body || {}
		const msg = await messages.addMessage({
			conversationId: Number(conversationId), role, content, images,
		})
		res.json(msg)
	} catch (e) { next(e) }
}

async function listMessages(req, res, next) {
	try {
		const { conversationId } = req.params
		const { limit, offset } = req.query
		const list = await messages.listMessages({
			conversationId: Number(conversationId),
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
		})
		res.json(list)
	} catch (e) { next(e) }
}

module.exports = { createConversation, listConversations, addMessage, listMessages }


