const { deleteUserById } = require('../../db')
const helpers = require('../helpers')

// Renders the account management view
const view = async (req, res, next) => {
  const values = {
    successMessage: req.session.accountManagementSuccess || false,
  }

  req.session.accountManagementSuccess = null

  res.render('accountManagement', values)
  next()
}

// Deletes and logs out the currently logged in user
const deleteUser = async (req, res, next) => {
  await deleteUserById(req.session.userId)
  helpers.destroySession(req, res)
  res.redirect('/')
  next()
}

// Changes the password for the currently logged in user. Will re-render account management view with success message
const changePassword = async (req, res, next) => {
  await helpers.changePassword(req.session.userId, req.body.newPassword)
  req.session.accountManagementSuccess = 'Password was successfully changed.'
  res.redirect('/account-management')
  next()
}

module.exports = {
  view,
  deleteUser,
  changePassword,
}
