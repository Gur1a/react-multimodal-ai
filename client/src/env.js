'use strict'

const env = {
	port: process.env.PORT ? Number(process.env.PORT) : 4000,
	region: process.env.TENCENT_REGION || 'ap-guangzhou',
	secretId: process.env.TENCENT_SECRET_ID || '',
	secretKey: process.env.TENCENT_SECRET_KEY || '',
	// MySQL
	dbHost: process.env.DB_HOST || '127.0.0.1',
	dbPort: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
	dbUser: process.env.DB_USER || 'thunder',
	dbPassword: process.env.DB_PASSWORD || 'gdlsd030312',
	dbName: process.env.DB_NAME || 'multimodal_ai',
}

module.exports = { env }
