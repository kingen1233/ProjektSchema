const express = require('express')
const routes = require('./src/routes')
const session = require('express-session')

const app = express()

// Needed for server-side rendering
app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(session({
  secret: 'very-safe-secret',
  resave: false,
  saveUninitialized: false,
}))

// This is used in order to make the session variables avalible in ejs rendering
app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn
  res.locals.userId = req.session.userId
  res.locals.userType = req.session.userType
  next()
})

app.use(routes)

app.listen(3000, () => {
  console.log('Listening to http://localhost:3000')
})
