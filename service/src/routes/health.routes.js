'use strict'

const { Router } = require('express')
const { ping } = require('../controllers/health.controller')

const router = Router()

router.get('/ping', ping)

module.exports = router


