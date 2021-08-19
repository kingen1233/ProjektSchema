const excelToJson = require('convert-excel-to-json')
const { getWeekBounds, fetchSchedule } = require('../helpers')
const computeSchedule = require('../scheduler2')
const { createPresentation, createParticipant, getScheduleForWeek, getAllScheduleWeeks } = require('../../db')
const moment = require('moment')

const view = (req, res, next) => {
  res.render('createSchedule', { isLoggedIn: req.session.isLoggedIn, errorMessage: false })
  next()
}

const action = async (req, res, next) => {
  // Create date from calender in front-end.
  const date = moment(req.body.date)
  if (date.isoWeekday() > 3) {
    // If day is between thurs - sun reload page with error message, since we cant schedule three days ahead.
    res.render('createSchedule', { isLoggedIn: req.session.isLoggedIn, errorMessage: 'You picked an invalid start day. Please pick a valid start day (mon,tue,wed)' })
  } else {
    // Save data.
    const week = date.isoWeek()
    const year = date.year()
    const rooms = [req.body.room1day1, req.body.room2day1,
      req.body.room1day2, req.body.room2day2,
      req.body.roomDay3]
    // Get mon and sunday for week and get a table with presentations for that week.
    const [mon, sun] = getWeekBounds(week, year)
    const table = await getScheduleForWeek(mon, sun)

    // if there's nothing scheduled for the week already.
    if (table.length < 1) {
      var filename = 'a'
      if (req.file) {
        filename = req.file.originalname
      }
      if (filename.includes('.xlsx')) { // Check if file is of the type xlsx.
        try {
          // Creates readable data from the xlsx file.
          const result = excelToJson({
            source: req.file.buffer,
            columnToKey: { // Changes the name of the columns.
              A: 'id',
              B: 'title',
              C: 'name1',
              D: 'email1',
              E: 'name2',
              F: 'email2',
              G: 'examinator',
              H: 'examinatorEmail',
              I: 'supervisor',
              J: 'supervisorEmail',
              K: 'courseCode',
            },
          })
          // Schedules the input and stores the schedule in the database.
          await doTheSchedule(result.Data, moment.utc(req.body.date).toDate(), rooms)
          const table = await fetchSchedule(week, year)
          const weeks = await getAllScheduleWeeks()

          res.render('schedule', { isLoggedIn: req.session.isLoggedIn, table, action: null, week, year, weeks, move: false, presentationId: -1, who: 'all', error: false })
          // Different errors for different cases.
        } catch (err) {
          console.error(err)
          res.render('createSchedule', { isLoggedIn: req.session.isLoggedIn, errorMessage: 'The information in the entered .xlsx file does not contain all the required fields. Make sure you sent in the correct file.' })
        }
      } else {
        res.render('createSchedule', { isLoggedIn: req.session.isLoggedIn, errorMessage: 'Wrong filetype entered!' })
      }
    } else {
      res.render('createSchedule', { isLoggedIn: req.session.isLoggedIn, errorMessage: 'A schedule already exists in: w.' + week + ' ' + year })
    }
  }

  next()
}

// Checks if value exists and is not a space.
const isOk = val => val && val !== ' '

async function doTheSchedule (rows, startDay, rooms) {
  // Checks if id exists and is a number.
  rows = rows.filter(r => Number.isInteger(r.id))
  const scheduleRaw = computeSchedule(rows, rooms)
  // For every element in ScheduleRaw append a startime.
  scheduleRaw.forEach(r => {
    r.startTime = new Date(Number(startDay) + r.time * 3600 * 1000 + (r.day - 1) * 86400 * 1000)
  })
  // For every row in scheduleRaw create a presentation.
  for (const row of scheduleRaw) {
    const id = await createPresentation(
      row.title,
      row.startTime,
      row.courseCode,
      row.room,
    )
    // Check guiltiness of all parameters.
    if (isOk(row.name1)) {
      await createParticipant(id, row.name1, row.email1, 'AUTHOR')
    }
    if (isOk(row.name2)) {
      await createParticipant(id, row.name2, row.email2, 'AUTHOR')
    }

    if (isOk(row.examinator)) {
      await createParticipant(id, row.examinator, row.examinatorEmail, 'EXAMINATOR')
    }
    if (isOk(row.supervisor)) {
      await createParticipant(id, row.supervisor, row.supervisorEmail, 'SUPERVISOR')
    }

    for (const opponent of row.opponents) {
      await createParticipant(id, opponent.name, opponent.email, 'OPPONENT')
    }
  }
}

module.exports = {
  view,
  action,
}
