const connection = require('./connection')
const bcrypt = require('bcrypt')

// TODO: Do real stuff
const getUser = async (id) => {
  const [rows] = await connection.query('SELECT id as test, data FROM test WHERE id IN (?)', [id])
  return rows.length === 1 ? rows[0] : null
}

const registerUser = async ({ firstName, lastName, email, newPassword }, userType) => {
  try {
    const [res] = await connection.query('INSERT INTO user (email, password, firstName, lastName, type) VALUES(?, ?, ?, ?, ?)', [email.toLowerCase(), newPassword, firstName, lastName, userType])
    return res.insertId
  } catch (err) {
    console.error(err)
  }
}

const changePasswordForUserId = async (userId, newPassword) => {
  try {
    await connection.query('UPDATE user SET password = ? WHERE userId = ?;', [newPassword, userId])
  } catch (err) {
    console.error(err)
  }
}

const isEmailUsed = async (email) => {
  try {
    const [rows] = await connection.query('SELECT email FROM user WHERE email = ?', [email])
    return rows.length > 0
  } catch (err) {
    console.error(err)
  }

  return false
}

const getUserByCredentials = async (email, password) => {
  try {
    const [rows] = await connection.query('SELECT * FROM user WHERE email = ?', [email])
    if (rows.length > 0 && await bcrypt.compare(password, rows[0].password)) {
      delete rows[0].password
      return rows[0]
    } else {
      return null
    }
  } catch (err) {
    console.error(err)
  }

  return null
}

const getUserById = async (userId) => {
  try {
    const [rows] = await connection.query('SELECT * FROM user WHERE userId = ?', [userId])
    return rows.length > 0 ? rows[0] : null
  } catch (err) {
    console.error(err)
  }

  return null
}

const deleteUserById = async (userId) => {
  try {
    await connection.query('DELETE FROM user WHERE userId = ?', [userId])
  } catch (err) {
    console.error(err)
  }
}

const getAllUsers = async () => {
  try {
    const [rows] = await connection.query('SELECT userId, email, firstName, lastName, type FROM user')
    return rows
  } catch (err) {
    console.error(err)
  }

  return []
}

const getProfileIdByUserId = async (userId) => {
  try {
    const [rows] = await connection.query('SELECT profileId FROM profile WHERE (userId) = (?)', [userId])
    return rows.length > 0 ? rows[0].profileId : null
  } catch (err) {
    console.error(err)
  }
  return null
}

const getProfileByUserId = async (userId) => {
  try {
    const [rows] = await connection.query('SELECT * FROM profile WHERE (userId) = (?)', [userId])
    return rows.length > 0 ? rows : null
  } catch (err) {
    console.error(err)
  }
  return null
}

const getCityByProfileId = async (profileId) => {
  try {
    const [rows] = await connection.query('SELECT city, cityId FROM profile LEFT JOIN city USING(cityId) WHERE (profileId) = (?)', [profileId])
    return rows.length > 0 ? rows : null
  } catch (err) {
    console.error(err)
  }
  return null
}

const getUniversityByProfileId = async (profileId) => {
  try {
    const [rows] = await connection.query('SELECT university, universityId FROM profile LEFT JOIN university USING(universityId) WHERE (profileId) = (?)', [profileId])
    return rows
    // return rows.length > 0 ? rows : null
  } catch (err) {
    console.error(err)
  }
  return null
}

const getLanguagesByProfileId = async (profileId) => {
  try {
    const [rows] = await connection.query('SELECT language, languageId FROM profile JOIN profileLanguage USING(profileId) JOIN language USING (languageId) WHERE (profileId) = (?)', [profileId])
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getCoursesByProfileId = async (profileId) => {
  try {
    const [rows] = await connection.query('SELECT course, courseId FROM profile JOIN profileCourse USING(profileId) JOIN course USING (courseId) WHERE (profileId) = (?)', [profileId])
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getAllCities = async () => {
  try {
    const [rows] = await connection.query('SELECT * FROM city ')
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getAllUniversities = async () => {
  try {
    const [rows] = await connection.query('SELECT * FROM university ')
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getAllLanguages = async () => {
  try {
    const [rows] = await connection.query('SELECT * FROM language ')
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getCoursesByUniversityId = async (universityId) => {
  try {
    const [rows] = await connection.query('SELECT courseId, course FROM course WHERE (universityId) = (?)', [universityId])
    return rows.length > 0 ? rows : null
  } catch (err) {
    console.error(err)
  }
  return null
}

const getAllCourses = async () => {
  try {
    const [rows] = await connection.query('SELECT courseId, course, universityId FROM course')
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const setProfile = async (profileId, cityId, universityId, thesisCourseId, alias, bio) => {
  try {
    await connection.query('UPDATE profile SET cityId = (?), universityId = (?), thesisCourseId = (?), alias = (?), bio = (?) WHERE profileId = (?)', [cityId, universityId, thesisCourseId, alias, bio, profileId])
  } catch (err) {
    console.error(err)
  }
}

const setProfileLanguage = async (profileId, languageId) => {
  try {
    await connection.query('INSERT INTO profileLanguage (profileId, languageId) VALUES (?, ?)', [profileId, languageId])
  } catch (err) {
    console.error(err)
  }
}

const removeProfileLanguage = async (profileId) => {
  try {
    await connection.query('DELETE FROM profileLanguage WHERE profileId = (?)', [profileId])
  } catch (err) {
    console.error(err)
  }
}

const setProfileCourse = async (profileId, courseId) => {
  try {
    await connection.query('INSERT INTO profileCourse (profileId, courseId) VALUES (?, ?)', [profileId, courseId])
  } catch (err) {
    console.error(err)
  }
}

const removeProfileCourse = async (profileId) => {
  try {
    await connection.query('DELETE FROM profileCourse WHERE profileId = (?)', [profileId])
  } catch (err) {
    console.error(err)
  }
}

const createDefaultProfile = async (userId) => {
  try {
    await connection.query('INSERT INTO profile (userId) VALUES (?)', [userId])
  } catch (err) {
    console.error(err)
  }
}

const getMessages = async (userId) => {
  try {
    const [rows] = await connection.query(`
    SELECT message.*, 
    fromProfile.alias AS 'fromUserName',
    toProfile.alias AS 'toUserName'
    FROM message 
    LEFT JOIN user fromUser ON (fromUser.userId = fromUserId) 
    LEFT JOIN user toUser ON (toUser.userId = toUserId) 
    LEFT JOIN profile fromProfile ON (fromProfile.userId = fromUserId)
    LEFT JOIN profile toProfile ON (toProfile.userId = toUserId)
    WHERE fromUserId = ? OR toUserId = ?;
    `, [userId, userId])
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}

const createMessage = async (fromUserId, toUserId, message) => {
  try {
    await connection.query('INSERT INTO message (fromUserId, toUserId, message) VALUES(?, ?, ?)', [fromUserId, toUserId, message])
  } catch (err) {
    console.error(err)
  }
}

const getAllScheduleWeeks = async () => {
  try {
    const [rows] = await connection.query(`
    SELECT 
    WEEK(startTime, 1) AS 'week',
    YEAR(startTime) AS 'year'
    FROM presentation
    GROUP BY week, year
    ORDER BY year, week;
    `)
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}

const getScheduleForWeek = async (from, to) => {
  try {
    const [rows] = await connection.query(`
    SELECT
    presentationId,
    title,
    startTime,
    courseCode,
    participant.name as 'participantName',
    participant.email,
    room as 'roomName',
    participant.type
    FROM presentation
    LEFT JOIN participant USING (presentationId)
    WHERE startTime BETWEEN ? AND ?;
    `, [from, to])
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}

const createPresentation = async (title, startTime, courseCode, room) => {
  try {
    const [res] = await connection.query('INSERT INTO presentation (title, startTime, courseCode, room) VALUES(?, ?, ?, ?)', [
      title,
      startTime,
      courseCode,
      room,
    ])
    return res.insertId
  } catch (err) {
    console.error(err)
  }
}

const createParticipant = async (presentationId, name, email, type) => {
  try {
    await connection.query('INSERT INTO participant (presentationId, name, email, type) VALUES(?, ?, ?, ?)', [
      presentationId,
      name,
      email,
      type,
    ])
  } catch (err) {
    console.error(err)
  }
}

const deleteScheduleForWeek = async (from, to) => {
  try {
    await connection.query('DELETE FROM presentation WHERE startTime BETWEEN ? AND ?;', [from, to])
  } catch (err) {
    console.error(err)
  }
}

/** Replaces the inserted presentation with a phony element instead.
 *  Also removes all participants connected to the presentation.
 *
 * @param {int} presentationId
 */
const deletePresentationFromId = async (presentationId) => {
  const phony = {
    id: ' ',
    title: 'Unscheduled Presentation',
    name1: ' ',
    email1: ' ',
    name2: ' ',
    email2: ' ',
    examinator: ' ',
    examinatorEmail: ' ',
    supervisor: ' ',
    supervisorEmail: ' ',
    courseCode: ' ',
    opponents: [],
  }

  try {
    await connection.query('DELETE FROM participant WHERE presentationId = ?;', [presentationId])
    await connection.query('UPDATE presentation SET title = ?, courseCode = ? WHERE presentationId = ?', [
      phony.title,
      phony.courseCode,
      presentationId,
    ])
  } catch (err) {
    console.error(err)
  }
}

const getMatchedProfiles = async (languages, courses, userId, universityId, thesisCourseId) => {
  try {
    const values = [universityId, userId]
    // checks if languages, courses and thesisCourseId is used and adds them to value if they are.
    if (languages.length) {
      values.push(languages)
    }

    if (courses.length) {
      values.push(courses)
    }

    if (thesisCourseId) {
      values.push(thesisCourseId)
    }

    const [rows] = await connection.query(`
    SELECT userId, alias
    FROM profile
    JOIN profileLanguage using(profileId)
    LEFT JOIN profileCourse using(profileId)
    WHERE universityId = (?)
    AND NOT userId = (?)
    ${languages.length ? 'AND languageId IN (?)' : ''}
    ${courses.length ? 'AND courseId IN (?)' : ''}
    ${thesisCourseId ? 'AND thesisCourseId = (?)' : ''}
    GROUP BY profileId
    `, values)
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getParticipantsByPresentationId = async (presentationId) => {
  try {
    const [rows] = await connection.query(`
    SELECT type, email, DATE(startTime) as 'presentationDate'
    FROM participant
    JOIN presentation USING (presentationId)
    WHERE presentationId = ?;
    `, [presentationId])
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}

const getParticipantsInDateInterval = async (from, to) => {
  try {
    const [rows] = await connection.query(`
    SELECT type, email, DATE(startTime) as 'presentationDate'
    FROM participant
    JOIN presentation USING (presentationId)
    WHERE startTime BETWEEN ? AND ?;
    `, [from, to])
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}
const getTimeRoom = async (presentationId) => {
  try {
    const [rows] = await connection.query(`
    SELECT startTime, room
    FROM presentation
    WHERE presentationId = ?;
    `, [presentationId])
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}

const updateTimeRoom = async (startTime, room, presentationId) => {
  try {
    const [rows] = await connection.query(`
    UPDATE presentation
    SET startTime = ?, room = ?
    WHERE presentationId = ?
    `, [startTime, room, presentationId])
    return rows
  } catch (err) {
    console.error(err)
    return []
  }
}
/**
 * Checks two presentation id's against each other, and sees if it would be possible to
 * swap their time and room without creating collisions in the schedule.
 * @param {int} presentationId1 id of the first presentation
 * @param {int} presentationId2 id of the second presentation
 * @returns true if a collision would happend, otherwise false.
 */
const checkIfCollison = async (presentationId1, presentationId2) => {
  // Checks if its possible to swap the presentations times without creating a collision
  // Looks at the start time for both of the presentations and checks if the same person will apear twice in the same day/time
  const check = async (a, b) => {
    const [rows] = await connection.query(`
    SELECT email FROM presentation
    JOIN participant USING (presentationId)
    WHERE 
    (startTime = (SELECT startTime FROM presentation WHERE presentationId = ?)
    AND presentationId != ?)
    OR presentationId = ?
    GROUP BY email
    HAVING COUNT(*) > 1;
    `, [a, a, b])

    return rows.length > 0
  }

  try {
    // Returns true if either combination generates a collision, otherwise false.
    return await check(presentationId1, presentationId2) || await check(presentationId2, presentationId1)
  } catch (err) {
    console.error(err)
    return true
  }
}

const getThesisCourseByProfileId = async (profileId) => {
  try {
    const [rows] = await connection.query('SELECT thesisCourseId, thesisCourse FROM thesisCourse LEFT JOIN profile USING(thesisCourseId) WHERE profileId = (?)', [profileId])
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getAllThesisCourse = async () => {
  try {
    const [rows] = await connection.query('SELECT * FROM thesisCourse')
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

const getMessagesBetweenUsers = async (fromUserId, toUserId) => {
  try {
    const [rows] = await connection.query('SELECT * FROM message WHERE (fromUserId = (?) AND toUserId = (?)) OR (toUserId = (?) AND fromUserId = (?)) ', [fromUserId, toUserId, fromUserId, toUserId])
    return rows
  } catch (err) {
    console.error(err)
  }
  return []
}

module.exports = {
  getUser,
  registerUser,
  isEmailUsed,
  getUserByCredentials,
  getProfileIdByUserId,
  getProfileByUserId,
  getCityByProfileId,
  getUniversityByProfileId,
  getLanguagesByProfileId,
  getCoursesByProfileId,
  getAllCities,
  getAllUniversities,
  getAllLanguages,
  getCoursesByUniversityId,
  setProfile,
  setProfileLanguage,
  removeProfileLanguage,
  setProfileCourse,
  removeProfileCourse,
  getAllCourses,
  createDefaultProfile,
  getMessages,
  createMessage,
  getAllScheduleWeeks,
  getScheduleForWeek,
  createPresentation,
  createParticipant,
  deleteScheduleForWeek,
  deletePresentationFromId,
  getMatchedProfiles,
  getParticipantsByPresentationId,
  getParticipantsInDateInterval,
  getTimeRoom,
  updateTimeRoom,
  getUserById,
  getAllUsers,
  deleteUserById,
  checkIfCollison,
  getThesisCourseByProfileId,
  getAllThesisCourse,
  getMessagesBetweenUsers,
  changePasswordForUserId,
}
