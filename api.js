'use strict'

require('dotenv').config()
const get = require('simple-get')
const fs = require('fs')
const path = require('path')
const fastify = require('fastify')({
  logger: true
})
let dbSsl = false

if (process.env.DB_SSL) {
  dbSsl = {
    ca: fs.readFileSync(path.join(__dirname, '/root.crt')).toString(),
    rejectUnauthorized: false
  }
}

fastify.register(require('fastify-postgres'), {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  ssl: dbSsl
})

fastify.register(require('fastify-cors'), {})

function getSolarData (lat, lon, usa, logger) {
  return new Promise(function (resolve, reject) {
    let url = `https://developer.nrel.gov/api/pvwatts/v6.json?api_key=${process.env.NREL_API_KEY}&lat=${lat}&lon=${lon}&system_capacity=1&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&dataset=${usa?'nsrdb':'intl'}`
    logger.info(url)
    const opts = {
      url: url,
      method: 'GET',
      json: true
    }
    return get.concat(opts, (error, response, body) => {
      logger.info(body)
      if (error) reject(error)
      if (body.errors.length) reject(new Error(body.errors))
      if (body && body.outputs && body.outputs.ac_annual) {
        logger.info(body.outputs.ac_monthly)
        resolve({
          annual_ac: body.outputs.ac_annual,
          monthly_ac: body.outputs.ac_monthly
        })
      } else {
        resolve(0)
      }
    })
  })
}

fastify.get('/solar/:lat/:lon/:region', async (req, reply) => {
  let response = {
    local: false,
    annual_kw: 0,
    monthly_kw: 0
  }
  try {
    req.log.info(`Trying db for ${req.params.lat} - ${req.params.lon}`)
    const client = await fastify.pg.connect()
    const result = await client.query(
      'SELECT annual, monthly FROM solar WHERE lat=$1 AND lon=$2', [req.params.lat, req.params.lon]
    )
    client.release()
    if (result && result.rows.length) {
      req.log.info(`Found!!`)
      let monthlyKw = []
      let months = result.rows[0].monthly.split(',')
      for (let i = 0; i < months.length; i++) {
        monthlyKw.push(parseFloat(months[i]))
      }
      response.local = true
      response.annual_kw = parseFloat(result.rows[0].annual)
      response.monthly_kw = monthlyKw
    } else {
      req.log.info(`No cache, ask NREL`)
      let output = await getSolarData(req.params.lat, req.params.lon, req.params.region === 'us', req.log)
      console.log.info(output)
      if (output.annual_ac > 0) {
        await client.query(
          'INSERT INTO solar VALUES($1,$2,$3,$4)', [
            output.annual_ac,
            output.monthly_ac.join(','),
            req.params.lat,
            req.params.lon
          ]
        )
      }
      response.annual_kw = output.annual_ac
      response.monthly_kw = output.monthly_ac
    }
    reply.send(response)
  } catch (err) {
    req.log.error(err)
    reply.send({ error: err.message })
  }
})

fastify.listen(3001, '0.0.0.0', err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
