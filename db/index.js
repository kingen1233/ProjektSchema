const connection = require('./connection')
const queries = require('./queries')

module.exports = {
  ...queries,
  connection,
}
