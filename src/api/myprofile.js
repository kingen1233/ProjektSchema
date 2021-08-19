const db = require('../../db')

const view = async (req, res, next) => {
  const profile = await db.getProfileByUserId(req.session.userId)
  const courses = await db.getCoursesByProfileId(profile[0].profileId)
  const languages = await db.getLanguagesByProfileId(profile[0].profileId)
  const allLanguages = await db.getAllLanguages()
  const allCities = await db.getAllCities()
  const allUniversities = await db.getAllUniversities()
  const allCourses = await db.getAllCourses()
  const allThesisCourses = await db.getAllThesisCourse()
  let showAlert = false

  const errorMessage = req.session.message
  req.session.message = undefined

  // Shows an alert if the user hasn't selected a language, a university and any type of course
  if (!(profile[0].universityId && languages.length > 0 && (courses.length > 0 || profile[0].thesisCourseId))) {
    showAlert = true
  }
  // Adds another column to allLanguages to see if the language is selected by the user
  allLanguages.forEach(e => {
    e.selected = 0
    for (let i = 0; i < languages.length; i++) {
      if (e.languageId === languages[i].languageId) {
        e.selected = 1
      }
    }
  })
  // Adds another column to allCourses to see if the course is selected by the user
  allCourses.forEach(e => {
    e.selected = 0
    for (let i = 0; i < courses.length; i++) {
      if (e.courseId === courses[i].courseId) {
        e.selected = 1
      }
    }
  })

  // Adds another column to allThesisCourses to see if the thesis course is selected by the user
  allThesisCourses.forEach(e => {
    e.selected = 0
    if (e.thesisCourseId === profile[0].thesisCourseId) {
      e.selected = 1
    }
  })

  // Adds a choice 'none' that will remove a thesis course if selected
  allThesisCourses.unshift({
    thesisCourseId: null,
    thesisCourse: 'None',
    selected: profile[0].thesisCourseId === null,
    universityId: null,
  })

  res.render('myprofile', { errorMessage, profile, courses, languages, allLanguages, allCities, allUniversities, allCourses: [], allThesisCourses, coursesStr: JSON.stringify(allCourses), showAlert, thesisCoursesStr: JSON.stringify(allThesisCourses) })

  next()
}

const action = async (req, res, next) => {
  // What happens when you press "Save profile".
  const profile = {
    profileId: await db.getProfileIdByUserId(req.session.userId),
    city: req.body.city === '' ? null : parseInt(req.body.city),
    university: req.body.university === '' ? null : parseInt(req.body.university),
    thesisCourse: ['', 'null'].includes(req.body.thesisCourse) ? null : parseInt(req.body.thesisCourse),
    alias: req.body.alias,
    bio: req.body.bio,
  }

  await db.setProfile(profile.profileId, profile.city, profile.university, profile.thesisCourse, profile.alias, profile.bio)

  await db.removeProfileLanguage(profile.profileId)
  if (req.body.language !== undefined) {
    for (let i = 0; i < req.body.language.length; i++) {
      await db.setProfileLanguage(profile.profileId, parseInt(req.body.language[i]))
    }
  }

  await db.removeProfileCourse(profile.profileId)
  if (req.body.course !== undefined) {
    for (let i = 0; i < req.body.course.length; i++) {
      await db.setProfileCourse(profile.profileId, parseInt(req.body.course[i]))
    }
  }

  req.session.message = 'Profile Saved.'

  res.redirect('myprofile')
  next()
}

module.exports = {
  view, action,
}
