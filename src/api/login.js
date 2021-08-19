const db = require('../../db')

const view = (req, res, next) => {
  // If the user is logged in, he will get redirected to the index page.
  if (req.session.isLoggedIn) {
    res.redirect('/')
  } else {
    res.render('login', { errorMessage: false })
  }
  next()
}

const action = async (req, res, next) => {
  const user = await db.getUserByCredentials(req.body.email, req.body.password)
  // Get user from database and check if its a valid user or not.
  if (user) {
    // Setup the session.
    req.session.isLoggedIn = true
    req.session.userId = user.userId
    req.session.userType = user.type
    res.locals.isLoggedIn = true
    res.locals.userId = user.userId
    res.locals.userType = user.type
    res.redirect('/')
  } else {
    // If the user entered invalid credentials, and no user was found we hit this.
    res.render('login', { errorMessage: 'Credentials did not match.' })
  }

  next()
}

module.exports = {
  view,
  action,
}
