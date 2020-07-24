require('dotenv').config(
  //{path: '.local.env'} Uncomment for local develop
)
const bodyParser = require('body-parser');
const cors = require('cors')
const express = require('express')
const app = express()

const port = process.env.PORT;

const Login = require('./login/login')
const Users = require('./users/users');

app.use(cors())
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

app.get('/api', (req, res) => {
  res.send('CaterinApp API is Working!');
})

app.use('/api/users', Users)
app.use('/api/login', Login)

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/api`)
})