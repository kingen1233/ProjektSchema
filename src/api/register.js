const db = require('../../db')
const { createUser } = require('../helpers')

const view = (req, res, next) => {
  // If the user is logged in, he will get redirected to the index page.
  if (req.session.isLoggedIn) {
    res.redirect('/')
  } else {
    res.render('register', { errorMessage: false })
  }
  next()
}

const action = async (req, res, next) => {
  // If success, payload will contain userId. Otherwise, it will contain an error message.
  const [success, payload] = await createUser(req.body)

  if (success) {
    // Get current user and setup the session.
    const user = await db.getUserById(payload)
    req.session.isLoggedIn = true
    req.session.userId = user.userId
    req.session.userType = user.type
    res.locals.isLoggedIn = true
    res.locals.userId = user.userId
    res.locals.userType = user.type
    res.redirect('/')
  } else {
    res.render('register', { errorMessage: payload })
  }

  next()
}

module.exports = {
  view,
  action,
}
