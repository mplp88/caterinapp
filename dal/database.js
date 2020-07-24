const mysql = require('mysql');

const host = process.env.HOST;
const user = process.env.DB_USER
const password = process.env.DB_PASS
const database = process.env.DB

const connection = mysql.createConnection({
  host,
  user,
  password,
  database
})

module.exports = connection;