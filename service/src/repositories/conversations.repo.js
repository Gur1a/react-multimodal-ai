'use strict'

const { getPool } = require('../db/mysql')

async function createConversation({ title }) {
	const pool = getPool()
	const [res] = await pool.execute(
		'INSERT INTO conversations (title) VALUES (?)',
		[title || null]
	)
	return { id: res.insertId, title: title || null }
}

async function listConversations({ limit = 50, offset = 0 } = {}) {
	const pool = getPool()
	const [rows] = await pool.execute(
		'SELECT id, title, created_at FROM conversations ORDER BY id DESC LIMIT ? OFFSET ?',
		[limit, offset]
	)
	return rows
}

module.exports = { createConversation, listConversations }


