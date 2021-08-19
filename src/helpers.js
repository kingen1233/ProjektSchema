const { getScheduleForWeek, getUserById } = require('../db')
const db = require('../db')
const moment = require('moment')
const xl = require('excel4node')
const bcrypt = require('bcrypt')

/**
 * This is a factory function that creates a middleware
 * @param userTypes - The userTypes allowed by the middleware. If not given, all userTypes will be allowed.
 * Multiple userTypes can be given as separate arguments, for example authenticate('A', 'B') will allow both userTypes 'A' and 'B'
 * @return {Function} - The express middleware
 */
const authenticate = (...userTypes) => (req, res, next) => {
  if (!req.session.isLoggedIn) {
    res.redirect('/')
  } else if (userTypes.length > 0 && !userTypes.includes(req.session.userType)) {
    res.redirect('/')
  } else {
    next()
  }
}

/**
 * Creates an matrix of given dimension, and initializes each cell with the given factory function
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @param func - Function to determine the value in each cell. Will default to undefined
 * @return {Array} - The resulting matrix
 */
function initMatrix (rows, cols, func = () => undefined) {
  const matrix = []
  for (let i = 0; i < rows; i++) {
    matrix[i] = []
    for (let j = 0; j < cols; j++) {
      matrix[i].push(func(i, j))
    }
  }

  return matrix
}

/**
 * Returns date objects for the first and last point in time of given week
 * @param week
 * @param year
 * @return {Date[]} - An array where first element is the first point in time, and the second is the last point in time
 */
function getWeekBounds (week, year) {
  const mon = moment()
    .year(year)
    .isoWeek(week)
    .set({ h: 0, m: 0, s: 0, ms: 0 })
    .startOf('isoWeek')
    .toDate()
  const sun = new Date(Number(mon) + 604799999) // Add one week (minus -1) worth of milliseconds to result in sunday 23:59:59:999
  return [mon, sun]
}

/**
 * Returns date objects for the first and last point in time of week containing given date
 * @param date
 * @return {Date[]} - An array where first element is the first point in time, and the second is the last point in time
 */
function getWeekBoundsFromDate (date) {
  const m = moment(date)
  const mon = m
    .startOf('isoWeek')
    .toDate()
  const sun = m
    .endOf('isoWeek')
    .toDate()

  return [mon, sun]
}

// This will convert given string to date at midnight at current timezone (instead of midnight at UTC)
function getDateFromStr (dateStr) {
  return new Date(dateStr + ' 00:00:00')
}

// Fetches a schedule for the given week. Will filter sessions for given userId, if provided
async function fetchSchedule (week, year, userId = null) {
  const [from, to] = getWeekBounds(week, year)
  const rows = await getScheduleForWeek(from, to)
  const user = userId ? await getUserById(userId) : null

  // Map all presentations
  let presentations = rows.reduce((acc, row) => {
    if (!acc.has(row.presentationId)) {
      acc.set(row.presentationId, {
        presentationId: row.presentationId,
        title: row.title,
        startTime: row.startTime,
        time: moment(row.startTime).format('HH:mm') + '-' + moment(row.startTime).add({ h: 1 }).format('HH:mm'),
        courseCode: row.courseCode,
        room: row.roomName,
        examinator: null,
        supervisor: null,
        author: null,
        opponent: null,
        participantEmails: [],
      })
    }

    const p = acc.get(row.presentationId)
    p.participantEmails.push(row.email) // Needed at later stage for filtering sessions

    // Add participants to the correct field
    switch (row.type) {
      case 'AUTHOR':
        if (!p.author) {
          p.author = row.participantName
        } else {
          p.author += ', ' + row.participantName // If author already exist, add this separated by comma
        }
        break
      case 'EXAMINATOR':
        p.examinator = row.participantName
        break
      case 'SUPERVISOR':
        p.supervisor = row.participantName
        break
      case 'OPPONENT':
        if (!p.opponent) {
          p.opponent = row.participantName
        } else {
          p.opponent += ', ' + row.participantName // If opponent already exist, add this separated by comma
        }
    }
    return acc
  }, new Map())

  presentations = [...presentations.values()] // Extract all presentation objects
    .filter(p => !userId || p.participantEmails.includes(user.email)) // If userId given, we need to filer for that user

  // We no longer need to know the emails of the participants, and therefore remove them
  presentations.forEach(p => {
    delete p.participantEmails
  })

  // Initialize the schedule matrix. Each cell will be an array containing all sessions at that specific time slot
  const matrix = initMatrix(10, 6, () => [])

  // Compute exactly where in the matrix a presentation at the given date should be placed
  const resolvePos = (date) => {
    const col = date.getDay()
    const row = date.getUTCHours() - 7
    return [row, col]
  }

  // Add week and year in the uppermost left corner
  matrix[0][0].push({ week: `w.${week}`, year: String(year) })

  const [mon] = getWeekBounds(week, year)
  const m = moment(mon)

  // Add the dates for the weekdays monday - friday as the first row
  matrix[0][1].push({ data: m.format('ddd DD/MM') })
  m.add({ d: 1 })
  matrix[0][2].push({ data: m.format('ddd DD/MM') })
  m.add({ d: 1 })
  matrix[0][3].push({ data: m.format('ddd DD/MM') })
  m.add({ d: 1 })
  matrix[0][4].push({ data: m.format('ddd DD/MM') })
  m.add({ d: 1 })
  matrix[0][5].push({ data: m.format('ddd DD/MM') })

  // Add labels for each time slot, as the first column
  matrix[1][0].push({ data: '8:00' })
  matrix[2][0].push({ data: '9:00' })
  matrix[3][0].push({ data: '10:00' })
  matrix[4][0].push({ data: '11:00' })
  matrix[5][0].push({ data: '12:00' })
  matrix[6][0].push({ data: '13:00' })
  matrix[7][0].push({ data: '14:00' })
  matrix[8][0].push({ data: '15:00' })
  matrix[9][0].push({ data: '16:00' })

  // Place each presentation in appropriate cell
  presentations.forEach(p => {
    const [row, col] = resolvePos(p.startTime)
    matrix[row][col].push(p)
    matrix[row][col].sort((a, b) => a.room.localeCompare(b.room)) // Sort presentations within a time slot to be more consistent
  })
  return matrix
}

// Creates a spreadsheet in memory and downloads it to the requesting client
const createSpreadsheet = (res, fileName, ...sheets) => {
  const wb = new xl.Workbook()

  // Create all sheets
  sheets.forEach(sheet => {
    const ws = wb.addWorksheet(sheet.sheetName)

    // Populate each given cell
    sheet.columns.forEach((col, i) => {
      col.forEach((cell, j) => {
        ws.cell(j + 1, i + 1).string(cell)
      })
    })
  })

  // Download the .xlsx file to the requesting client
  wb.write(fileName, res)
}

/**
 * Creates an user
 * @param firstName - First name of the user
 * @param lastName - Surname of the user
 * @param email - Email (and username) of the user
 * @param newPassword - Users chosen password
 * @param userType - The type of user to create. Will default to STUDENT
 * @return {Promise<*[]>} - An array where the first element is a flag telling if the went well or not, and the second the created userId (if it went well)
 */
const createUser = async ({ firstName, lastName, email, newPassword }, userType = 'STUDENT') => {
  const isEmailUsed = await db.isEmailUsed(email)
  if (isEmailUsed) {
    return [false, 'Email is already in use.']
  } else {
    const userId = await db.registerUser({ firstName, lastName, email, newPassword: await bcrypt.hash(newPassword, 10) }, userType)
    await db.createDefaultProfile(userId)
    return [true, userId]
  }
}

// Change given users password
const changePassword = async (userId, newPassword) => {
  const hashedPass = await bcrypt.hash(newPassword, 10)
  await db.changePasswordForUserId(userId, hashedPass)
}

// Destroys everything related to the currently logged in users session (effectively logging them out)
const destroySession = (req, res) => {
  req.session.isLoggedIn = false
  req.session.userId = null
  req.session.userType = null
  res.locals.isLoggedIn = false
  res.locals.userId = null
  res.locals.userType = null
}

module.exports = {
  authenticate,
  getWeekBounds,
  fetchSchedule,
  initMatrix,
  getDateFromStr,
  getWeekBoundsFromDate,
  createSpreadsheet,
  createUser,
  changePassword,
  destroySession,
}
