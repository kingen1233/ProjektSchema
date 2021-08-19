const { createSpreadsheet, getWeekBounds } = require('../helpers')
const db = require('../../db')

// Downloads an xlsx file with participants for either a specified day oar a specified week
async function action (req, res) {
  const { presentationId, presentationYear, presentationWeek } = req.query
  let downloadName

  let participants = []

  // Whether to include participant from a specific session or the whole week
  if (presentationId) {
    downloadName = `presentation-${presentationId}.xlsx`
    participants = await db.getParticipantsByPresentationId(presentationId)
  } else if (presentationYear && presentationWeek) {
    downloadName = `presentations-${presentationYear}w${presentationWeek}.xlsx`
    const [from, to] = getWeekBounds(presentationWeek, presentationYear)
    participants = await db.getParticipantsInDateInterval(from, to)
  }

  let sheets = participants
    .filter(p => p.email) // Only include participant with a stored email
    .reduce((acc, p) => {
      const dateStr = p.presentationDate.toLocaleDateString('sv-SE')

      // If not exist, create sheet with current date, example "2020-12-12", as the name. Also prepare the columns
      if (!acc[dateStr]) {
        acc[dateStr] = {
          sheetName: dateStr,
          columns: [
            ['authors'],
            ['opponents'],
            ['examinators'],
            ['supervisors'],
          ],
        }
      }

      let arr

      // Place the participant in the correct category (which will be a specific column in the actual file)
      const [authors, opponents, examinators, supervisors] = acc[dateStr].columns
      switch (p.type) {
        case 'AUTHOR':
          arr = authors
          break
        case 'OPPONENT':
          arr = opponents
          break
        case 'EXAMINATOR':
          arr = examinators
          break
        case 'SUPERVISOR':
          arr = supervisors
          break
      }

      arr.push(p.email)
      return acc
    }, {})

  // Sort the sheets based on their name (a date) in chronological order
  sheets = Object.values(sheets)
    .sort((a, b) => new Date(a.sheetName) - new Date(b.sheetName))

  // Creates the xlsx file and downloads it to the client
  await createSpreadsheet(res, downloadName, ...sheets)
}

module.exports = {
  action,
}
