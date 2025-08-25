'use strict'

const mysql = require('mysql2/promise')
const { env } = require('../config/env')

let pool

function getPool() {
	if (!pool) {
		pool = mysql.createPool({
			host: env.dbHost,
			port: env.dbPort,
			user: env.dbUser,
			password: env.dbPassword,
			database: env.dbName,
			connectionLimit: 10,
			charset: 'utf8mb4',
		})
	}
	return pool
}

module.exports = { getPool }


