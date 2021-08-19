const { destroySession } = require('../helpers')

// Logs out the currently logged in user
const action = (req, res, next) => {
  destroySession(req, res)
  res.redirect('/')
  next()
}

module.exports = {
  action,
}
