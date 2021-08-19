// Renders the welcome page. Will redirect to login if user not logged in
const view = (req, res, next) => {
  const isLoggedIn = req.session.isLoggedIn
  if (isLoggedIn) {
    res.render('index')
  } else {
    res.redirect('/login')
  }
  next()
}

module.exports = {
  view,
}
