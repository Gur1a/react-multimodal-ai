'use strict'

async function ping(req, res) {
	res.json({ ok: true, ts: Date.now() })
}

module.exports = { ping }


