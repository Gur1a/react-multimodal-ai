'use strict'

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { notFound, errorHandler } = require('./middlewares/error')

const app = express()
const router = require('./routes')


app.use(cors())
app.use(express.json({ limit: '20mb' }))

app.use(router)

app.use(notFound)
app.use(errorHandler)

module.exports = { app }


