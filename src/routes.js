const express = require('express')
const multer = require('multer')
const router = express.Router()
const { authenticate } = require('./helpers')

const {
  register,
  login,
  droppage,
  logout,
  schedule,
  createSchedule,
  chat,
  myprofile,
  profile,
  profileSearch,
  mailList,
  admin,
  accountManagement,
} = require('./api')

router.get('/', droppage.view)

router.get('/register', register.view)
router.post('/register', register.action)

router.get('/login', login.view)
router.post('/login', login.action)

router.post('/logout', logout.action)

router.get('/schedule', schedule.view)
router.post('/schedule', schedule.action)

router.get('/createSchedule', authenticate('STAFF'), createSchedule.view)
router.post('/createSchedule', authenticate('STAFF'), multer().single('file'), createSchedule.action)

router.get('/chat', authenticate('STUDENT'), chat.view)
router.get('/chat-messages', authenticate('STUDENT'), chat.getAllMessages)
router.post('/chat-messages', authenticate('STUDENT'), chat.createMessage)

router.get('/myprofile', authenticate('STUDENT'), myprofile.view)
router.post('/myprofile', authenticate('STUDENT'), myprofile.action)

router.get('/profile/:id', authenticate('STUDENT'), profile.profile)

router.get('/profileSearch', authenticate('STUDENT'), profileSearch.view)

router.get('/mail-list', mailList.action)

router.get('/admin', authenticate('ADMIN'), admin.view)
router.post('/users/:userId', authenticate('ADMIN'), admin.deleteUser)
router.post('/users', authenticate('ADMIN'), admin.addUser)

router.get('/account-management', authenticate(), accountManagement.view)
router.post('/account-management/remove-account', authenticate('STUDENT'), accountManagement.deleteUser)
router.post('/account-management/change-password', authenticate(), accountManagement.changePassword)

module.exports = router
