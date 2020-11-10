const express = require('express')
const iterableUser = require('./api/user')
const bodyParser = require('body-parser')

const app = express()

const port = process.env.PORT

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Iterable BackFiller Ok')
})

app.post('/backfill-user-devices', (req, res) => {
  const {limit, offset} = req.body || {}
  iterableUser.backFillUserDevices(limit, offset)
  res.status(200).json({ ok: true })
})

app.listen(port, () => {
  console.log(`Iterable BackFiller listening at http://localhost:${port}`)
})