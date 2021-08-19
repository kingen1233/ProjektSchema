const db = require('../../db')

// Sorts the matched profiles randomly
function shuffleArray (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
}

const view = async (req, res, next) => {
  const profile = await db.getProfileByUserId(req.session.userId)
  const profileId = profile[0].profileId
  const courses = await db.getCoursesByProfileId(profileId)
  const languages = await db.getLanguagesByProfileId(profileId)
  const thesisCourse = await db.getThesisCourseByProfileId(profileId)

  // Checks if the user has the necessary data filled out in their profile. Redirect to /myprofile if they don't.
  if (!(profile[0].universityId && languages.length > 0 && (courses.length > 0 || thesisCourse[0]))) {
    res.redirect('myprofile')
    next()
    return
  }

  const languageIds = []
  languages.forEach(language => languageIds.push(language.languageId))
  const courseIds = []
  courses.forEach(course => courseIds.push(course.courseId))

  // Default setting of the radio-buttons
  let studyPartner = 1
  let thesisPartner = 0
  let disableStudy = false
  let disableThesis = false

  // If the user has selected no ordinary courses, they shall not be able to filter ordinary courses.
  if (courses.length === 0) {
    disableStudy = true
    studyPartner = 0
    thesisPartner = 1
  }

  // If the user has selected no thesis course, they shall not be able to filter based on thesis course.
  if (!thesisCourse[0]) {
    disableThesis = true
  }

  if (req.query.partnerChoice) {
    studyPartner = req.query.partnerChoice === 'study' ? 1 : 0
    thesisPartner = req.query.partnerChoice === 'thesis' ? 1 : 0
  }

  const selLanguages = req.query.languages || languageIds
  const selCourses = req.query.courses || courseIds
  const userId = req.session.userId

  // Fills an array of matches based on if they are looking for a study partner or a thesis partner.
  const empty = []
  let matches
  if (studyPartner === 1) {
    matches = await db.getMatchedProfiles(selLanguages, selCourses, userId, profile[0].universityId)
  } else {
    matches = await db.getMatchedProfiles(selLanguages, empty, userId, profile[0].universityId, thesisCourse[0].thesisCourseId)
  }

  // Adds another column to languages to see if the language is selected by the user
  languages.forEach(e => {
    e.selected = 0
    for (let i = 0; i < selLanguages.length; i++) {
      if (e.languageId === Number(selLanguages[i])) {
        e.selected = 1
      }
    }
  })

  // Adds another column to courses to see if the course is selected by the user
  courses.forEach(e => {
    e.selected = 0
    for (let i = 0; i < selCourses.length; i++) {
      if (e.courseId === Number(selCourses[i])) {
        e.selected = 1
      }
    }
  })

  shuffleArray(matches)

  // max 5 profiles shown at once
  const matchAmount = Math.min(matches.length, 5)

  res.render('profileSearch', { courses, languages, matches, thesisPartner, studyPartner, matchAmount, thesisCourse, showStudy: JSON.stringify(studyPartner), disableStudy: JSON.stringify(disableStudy), disableThesis: JSON.stringify(disableThesis) })
  next()
}

module.exports = {
  view,
}
