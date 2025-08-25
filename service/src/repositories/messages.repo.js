'use strict'

const { getPool } = require('../db/mysql')

async function addMessage({ conversationId, role, content, images }) {
	const pool = getPool()
	const [res] = await pool.execute(
		'INSERT INTO messages (conversation_id, role, content, images) VALUES (?, ?, ?, ?)',
		[conversationId, role, content, images ? JSON.stringify(images) : null]
	)
	return { id: res.insertId }
}

async function listMessages({ conversationId, limit = 200, offset = 0 }) {
	const pool = getPool()
	const [rows] = await pool.execute(
		'SELECT id, role, content, images, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT ? OFFSET ?',
		[conversationId, limit, offset]
	)
	return rows.map((r) => ({ ...r, images: r.images ? JSON.parse(r.images) : [] }))
}

module.exports = { addMessage, listMessages }


