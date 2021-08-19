const mysql = require('mysql2')

// Configure the DB connection. Please not that real secrets should NEVER be committed!
const pool = mysql.createPool({
  host: 'oliverekberg.com',
  user: 'user',
  password: 'password',
  database: 'study_match',
  port: '3307',
})

module.exports = pool.promise()
