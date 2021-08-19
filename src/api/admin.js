const { getAllUsers, deleteUserById } = require('../../db')
const { createUser } = require('../helpers')

// Renders the administration view with all users populated
const view = async (req, res, next) => {
  const values = {
    errorMessage: req.session.adminError || false,
    successMessage: req.session.adminSuccess || false,
    users: await getAllUsers(),
  }

  req.session.adminError = null
  req.session.adminSuccess = null

  res.render('admin', values)
  next()
}

// Removes user with given id
const deleteUser = async (req, res, next) => {
  await deleteUserById(req.params.userId)
  req.session.adminSuccess = 'User was successfully deleted.'
  res.redirect('/admin')
  next()
}

// Adds staff user with given credentials
const addUser = async (req, res, next) => {
  const [success, payload] = await createUser(req.body, 'STAFF')

  if (success) {
    req.session.adminSuccess = 'User was successfully registered.'
    res.redirect('/admin')
  } else {
    req.session.adminError = payload
    res.redirect('/admin')
  }

  next()
}

module.exports = {
  view,
  deleteUser,
  addUser,
}
