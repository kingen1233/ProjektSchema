const db = require('../../db')
const { fetchSchedule, getWeekBounds } = require('../helpers')
const moment = require('moment')

let move = false
/**
* Gets the week and year for the closest week to local time that has a presentation.
* If no presentations exists in the future, look back in time instead.
* If no presentation exists at all an empty schedule will be shown for the current week.
* @return {[int, int]} - The next week and year where something is shedueled, or the current week if nothing is scheduled.
*/
async function getNextWeekYear () {
  const week = moment().week()
  const year = moment().year()
  const weekList = await db.getAllScheduleWeeks()

  // Find the first row with a later week, or later year and week.
  let x = weekList.find(row => {
    return (row.year === year && row.week >= week) || (row.year > year)
  })

  // If none was found, search for a week that has already passed.
  if (!x) {
    x = weekList.reverse().find(row => {
      return (row.year === year && row.week < week) || (row.year < year)
    })
  }
  // Return the found week, or the current week if nothing was found.
  return x || { week, year }
}

const view = async (req, res, next) => {
  move = false
  const weekYear = await getNextWeekYear()
  const table = await fetchSchedule(weekYear.week, weekYear.year)
  const weeks = await db.getAllScheduleWeeks()
  res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: null, week: weekYear.week, year: weekYear.year, weeks, move: false, presentationId: -1, who: 'all', error: false })

  next()
}

const action = async (req, res, next) => {
  var action = 'a'

  // Sets an action if one was generated from front-end.
  if (req.body.edit === 'editSchedule') {
    action = 'edit'
  } else if (req.body.returnFromEdit === 'returnFromEdit') {
    action = 'returnFromEdit'
  } else if (req.body.deleteSchedule === 'deleteSchedule') {
    action = 'deleteSchedule'
  } else if (req.body.deletePresentation) {
    action = 'deletePresentationId'
  } else if (req.body.addOpponent) {
    action = 'addOpponent'
  } else if (req.body.movePresentation) {
    action = 'movePresentation'
  } else if (req.body.swapPresentation) {
    action = 'swapPresentation'
  }

  // Retrive parameters generated in the front-end.
  const week = Number(req.body.week)
  const year = Number(req.body.year)
  const who = req.body.who
  const userId = who === 'me' ? req.session.userId : null
  let error = false
  const weeks = await db.getAllScheduleWeeks()

  /* Every IF statement will perform some individual functionality, and then eventually fetch the appropriate schedule
     the database and then render it in the front-end. Every render also takes additional attributes to display various
     things and allow different functionality.
  */

  if (req.body.selectedWeek) {
    // Retrives selected week from front-end and store it into variables.
    const [w, y] = req.body.selectedWeek.split(',').map(Number)
    const table = await fetchSchedule(w, y, userId)
    res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: action, week: w, year: y, weeks, move: false, presentationId: -1, who, error })
  } else if (action === 'edit' || action === 'returnFromEdit') {
    // Re-render the front-end. If action is set to "edit" more functionality is displayed for the user.
    const table = await fetchSchedule(week, year, userId)
    res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: action, week, year, weeks, move: false, presentationId: -1, who, error })
  } else if (action === 'deleteSchedule') {
    // Gets start-day and end-day of week and removes all presentations within this timegap.
    const [mon, sun] = getWeekBounds(week, year)
    await db.deleteScheduleForWeek(mon, sun)
    res.redirect('/schedule')
  } else if (action === 'deletePresentationId') {
    // Deletes specific presentation based on presentation id retrieved from front-end.
    await db.deletePresentationFromId(req.body.presentationId)
    const [mon, sun] = getWeekBounds(week, year)
    const rows = await db.getScheduleForWeek(mon, sun)
    // If schedule has no more presentations refresh the page with no information, else reload the webpage with current week and year.
    if (rows.length < 1) {
      res.redirect('/schedule')
    } else {
      const table = await fetchSchedule(week, year, userId)
      res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: 'edit', week, year, weeks, move: false, presentationId: -1, who, error })
    }
  } else if (action === 'addOpponent') {
    // Adds opponents to a specific presentation, specified with information from the front-end.
    await db.createParticipant(req.body.addOpponentPresentationId, req.body.studentName, req.body.studentEmail, 'OPPONENT')
    const table = await fetchSchedule(week, year, userId)
    res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: 'edit', week, year, weeks, move: false, presentationId: -1, who, error })
  } else if (action === 'movePresentation') {
    // Holds a presentation in a state ready for move.
    move = true
    const presentationId = req.body.presentationId
    const table = await fetchSchedule(week, year, userId)

    // Checks which presentations selected presentations can be swapped with without causing collisions in the schedule.
    const check = async (pThis, el) => {
      const c = await db.checkIfCollison(pThis, el.presentationId)
      el.collide = !c
    }

    const promises = []
    // Creates a list of promises and then runs them parallel causing a faster load time.
    for (let i = 1; i < table.length; i++) {
      for (let j = 1; j < table[i].length; j++) {
        for (const el of table[i][j]) {
          if (el.presentationId === presentationId) continue
          promises.push(check(presentationId, el))
        }
      }
    }

    await Promise.all(promises)
    res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: 'edit', week, year, weeks, move, presentationId, who, error })
  } else if (action === 'swapPresentation') {
    // Swaps the date and room for two specified presentations.
    const presId1 = req.body.presentationId
    const presId2 = req.body.presentationIdSelected
    const infoPres1 = await db.getTimeRoom(presId1)
    const infoPres2 = await db.getTimeRoom(presId2)
    const collide1 = await db.checkIfCollison(presId1, presId2)
    await db.updateTimeRoom(infoPres2[0].startTime, infoPres2[0].room, presId1)
    await db.updateTimeRoom(infoPres1[0].startTime, infoPres1[0].room, presId2)
    const table = await fetchSchedule(week, year, userId)
    if (!collide1) {
      // If there is no collision when we swapped, render the page.
      res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: 'edit', week, year, weeks, move: false, presentationId: -1, who, error })
    } else {
      // If there is a collision when we swapped, still do it but let the user know with an error message.
      error = 'Your recent change in the schedule generated a collision. Please double check that this is how you want the schedule to be.'
      res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action: 'edit', week, year, weeks, move: false, presentationId: -1, who, error })
    }
  } else {
    // If we hit this, something went wrong.
    const table = await fetchSchedule(week, year, userId)
    error = 'An unexpected error occurred.'
    res.render('schedule', { isLoggedIn: req.session.isLoggedIn, userType: req.session.userType, table, action, week, year, weeks, move: false, presentationId: -1, who, error })
  }

  next()
}

module.exports = {
  view,
  action,
}
