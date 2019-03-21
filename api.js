'use strict'

const get = require('simple-get')
const fastify = require('fastify')({
  logger: true
})

fastify.register(require('fastify-postgres'), {
  user: 'solar',
  host: 'localhost',
  database: 'solar',
  password: 'qwerty',
  port: 5432,
  ssl: false
})

fastify.register(require('fastify-cors'), {})

function getSolarData (lat, lon, logger) {
  return new Promise(function (resolve, reject) {
    //         https://developer.nrel.gov/api/pvwatts/v5.json?api_key=DEMO_KEY&lat=41.38879&lon=2.15899&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&dataset=intl
    let url = `https://developer.nrel.gov/api/pvwatts/v5.json?api_key=DEMO_KEY&lat=${lat}&lon=${lon}&system_capacity=1&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10&dataset=intl`
    const opts = {
      url: url,
      method: 'GET',
      // headers: headers,
      json: true
    }
    return get.concat(opts, (error, response, body) => {
      logger.info(body.outputs)
      if (error) reject(error)
      if (body && body.outputs && body.outputs.ac_annual) {
        console.log(body.outputs.ac_monthly)
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

fastify.get('/solar/:lat/:lon', async (req, reply) => {
  let response = {
    local: false,
    annual_kw: 0,
    monthly_kw: 0
  }
  try {
    const client = await fastify.pg.connect()
    const result = await client.query(
      'SELECT annual, monthly FROM solar WHERE lat=$1 AND lon=$2', [req.params.lat, req.params.lon]
    )
    client.release()
    if (result && result.rows.length) {
      let monthlyKw = []
      let months = result.rows[0].monthly.split(',')
      for (let i=0; i < months.length; i++ ) {
        monthlyKw.push(parseFloat(months[i]))
      }
      response.local = true
      response.annual_kw = parseFloat(result.rows[0].annual)
      response.monthly_kw = monthlyKw
    } else {
      let output = await getSolarData(req.params.lat, req.params.lon, req.log)
      if (output.annual_ac > 0) {
        await client.query(
          'INSERT INTO solar VALUES($1,$2,$3,$4)', [
            output.annual_ac,
            req.params.lat,
            req.params.lon,
            output.monthly_ac.join(',')
          ]
        )
      }
      response.annual_kw = output.annual_ac
      response.monthly_kw = output.monthly_ac
    }
    reply.send(response)
  } catch (err) {
    console.log(err)
    reply.send(err.message)
  }
})

fastify.listen(process.env.SOLAR_SVC_PORT || 3001, '0.0.0.0', err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
