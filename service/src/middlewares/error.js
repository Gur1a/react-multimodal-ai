'use strict'

function notFound(req, res, next) {
	res.status(404).json({ error: 'Not Found', path: req.originalUrl })
}

function errorHandler(err, req, res, next) {
	// eslint-disable-next-line no-console
	console.error('Unhandled error:', err)
	res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' })
}

module.exports = { notFound, errorHandler }


