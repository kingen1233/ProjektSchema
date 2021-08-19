const db = require('../../db')

const profile = async (req, res, next) => {
  const profile = await db.getProfileByUserId(req.params.id)
  const city = await db.getCityByProfileId(profile[0].profileId)
  const university = await db.getUniversityByProfileId(profile[0].profileId)
  const courses = await db.getCoursesByProfileId(profile[0].profileId)
  const languages = await db.getLanguagesByProfileId(profile[0].profileId)
  const thesisCourse = await db.getThesisCourseByProfileId(profile[0].profileId)
  const messages = await db.getMessagesBetweenUsers(req.session.userId, profile[0].userId)

  let messageSent = false
  if (messages.length > 0) messageSent = true

  res.render('profile', { profile, city, university, courses, languages, thesisCourse, messageSent })
  next()
}

module.exports = {
  profile,
}
