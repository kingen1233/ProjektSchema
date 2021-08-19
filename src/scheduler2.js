// Lays a schedule with the given data
module.exports = (inData, rooms) => {
  let value = 0

  // If no room given, it will default to a hardcoded value
  rooms.forEach(e => {
    if (e.length < 1) {
      rooms[value] = 'UNKNOWN ROOM'
    }
    value++
  })

  const presentations = inData

  // Extract the course code for each presentation. This is needed because the input data is a bit inconsistent
  presentations.forEach(row => {
    row.courseCode = row.courseCode.split(' ')[0]
  })

  // Creates a unique key for two string. The same key will be generated no matter what order the two string are given
  const getKey = (a, b) => {
    if (a.localeCompare(b) > 0) {
      return a + b
    } else {
      return b + a
    }
  }

  // Computes key for each presentation, based on the names of the examinator and the supervisor
  presentations.forEach(row => {
    row.key = getKey(row.examinator, row.supervisor)
  })

  // Compute the number of presentations grouped by their key
  const keyCounts = presentations.reduce((acc, row) => {
    acc[row.key] = (acc[row.key] || 0) + 1
    return acc
  }, [])

  // Sorts the data based on how many times the key occurs. If the keys occur the same amount of times, sort by the key itself, lexicographically
  const dataSort = (a, b) => {
    if (keyCounts[a.key] === keyCounts[b.key]) {
      return a.key.localeCompare(b.key)
    } else {
      return keyCounts[a.key] > keyCounts[b.key] ? -1 : 1
    }
  }
  presentations.sort(dataSort)

  const groups = []

  // Creates groups of examinators and supervisors where each group can be scheduled independent of each other
  presentations.forEach(row => {
    const idxE = groups.findIndex(g => g.includes(row.examinator))
    const idxS = groups.findIndex(g => g.includes(row.supervisor))

    // If they already (or should) exist in same group
    if (idxE === idxS) {
      // If they are not yet in a group, create one and add them both. Otherwise do nothing as they already belong to group
      if (idxE === -1) {
        groups.push([
          row.examinator,
          row.supervisor,
        ])
      }
    } else {
      if (idxE === -1) { // If examinator does not belong to group, add to supervisors group as they need to be together
        groups[idxS].push(row.examinator)
      } else if (idxS === -1) { // If supervisor does not belong to group, add to examinators group as they need to be together
        groups[idxE].push(row.supervisor)
      } else { // If both belonged to different groups before, combine these groups into one
        groups[idxS].push(...groups[idxE])
        groups.splice(idxE, 1)
      }
    }
  })

  // Creates a map of groups for faster searching
  const final = {}
  groups.forEach((group, groupId) => {
    const inGroup = presentations.filter(a => group.includes(a.examinator))
    inGroup.forEach(i => {
      if (!final[i.key]) {
        final[i.key] = {
          items: [],
          id: groupId,
        }
      }

      final[i.key].items.push(i)
    })
  })

  // Sort groups based on how many in each
  const values = Object.values(final)
    .sort((a, b) => a.items.length > b.items.length ? -1 : 1)

  const slots = [
    [], // Day 1, slot A
    [], // Day 1, slot B
    [], // Day 2, slot A
    [], // Day 2, slot B
    [], // Day 3, only one slot
  ]

  // Place each presentation into a slot
  while (values.length) {
    const item = values.shift() // Remove the first item
    let idx
    if (slots[0].length + item.items.length <= 8) { // If all items can be added to first day
      idx = 0
    } else if (slots[2].length + item.items.length <= 8) { // If all items can be added to second day
      idx = 2
    } else { // Otherwise add to last day
      slots[4].push(...item.items)
      continue
    }
    slots[idx].push(...item.items)

    // Compute list of all candidates to add at that slot
    const candidates = values.filter(l => l.id !== item.id)
    if (candidates.length === 0) {
      continue
    }

    let sumSlots = 0
    const matches = []
    const idxs = []

    // Add candidates while they can fit in slot
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].items.length + sumSlots <= item.items.length) {
        idxs.push(i)
        sumSlots += candidates[i].items.length
      }
    }

    if (item.items.length !== sumSlots) {
      console.error('DANGER!!!')
    }

    // Extract all indexes to remove. Do this in reverse in order to no change other matched indices
    idxs.reverse().forEach(indx => {
      const rIdx = values.findIndex(l => l === candidates[indx])
      matches.push(values[rIdx])
      values.splice(rIdx, 1)
    })

    matches.reverse()
    const toPush = []
    matches.forEach(match => {
      toPush.push(...match.items)
    })
    slots[idx + 1].push(...toPush)
  }

  // Will contain all slots that has only one or two presentation and therefore cannot schedule oppositions internally
  const loneSlotsIdxs = []

  // Schedule opponents
  slots
    .filter(slot => slot.length > 0)
    .forEach((slot, idx) => {
      slot.forEach(s => {
        s.room = rooms[idx] // Assign correct room
        s.opponents = [] // Initialize list of opponents
      })

      // If less than 3 presentations at slot, no opponents can be schedule. Save for later computation
      if (slot.length < 3) {
        loneSlotsIdxs.push(idx)
        return
      }

      // Adds opponents from a given time slot to another
      const addOpponents = (fromIdx, toIdx) => {
        slot[toIdx].opponents.push({ name: slot[fromIdx].name1, email: slot[fromIdx].email1 })

        if (slot[fromIdx].name2) {
          slot[toIdx].opponents.push({ name: slot[fromIdx].name2, email: slot[fromIdx].email2 })
        }
      }

      // Swaps opponents for three presentations
      const swapThree = (offset = 0) => {
        addOpponents(offset, offset + 1)
        addOpponents(offset + 1, offset + 2)
        addOpponents(offset + 2, offset)
      }

      // Swaps opponents for four presentations
      const swapFour = (offset = 0) => {
        addOpponents(offset, offset + 2)
        addOpponents(offset + 1, offset)
        addOpponents(offset + 2, offset + 3)
        addOpponents(offset + 3, offset + 1)
      }

      switch (slot.length) {
        case 3:
        case 6:
          for (let i = 0; i < slot.length; i += 3) {
            swapThree(i)
          }
          break
        case 4:
          swapFour(0)
          break
        case 5:
          // Custom case, and therefore not extracted into helper function
          addOpponents(0, 2)
          addOpponents(1, 0)
          addOpponents(2, 4)
          addOpponents(3, 1)
          addOpponents(4, 3)
          break
        case 7:
          swapFour(0)
          swapThree(4)
          break
        case 8:
          swapFour(0)
          swapFour(4)
          break
      }
    })

  const rows = []

  slots.forEach((slot, i) => {
    // Resolve day based on slot
    let day = 1
    switch (i) {
      case 0:
      case 1:
        day = 1
        break
      case 2:
      case 3:
        day = 2
        break
      case 4:
        day = 3
        break
    }

    // Resolve startTime based on index
    slot.forEach((row, idx) => {
      row.time = idx + 8 + (idx + 8 > 11 ? 1 : 0)
      row.day = day
      rows.push(row)
    })
  })

  // Handle lone slots
  loneSlotsIdxs.forEach(idx => {
    const all = []

    // Fill array "all" with all presentations from lone slots
    slots
      .filter((_, i) => i !== idx)
      .forEach(slot => all.push(...slot))

    // Try to add opponents, if possible, to a non-colliding presentation with as few current opponents as possible
    slots[idx].forEach(p => {
      let min = Infinity
      let minS = null
      all
        .filter(l => !(l.day === p.day && l.time === p.time))
        .forEach(l => {
          if (l.opponents.length < min) {
            min = l.opponents.length
            minS = l
          }
        })

      if (minS) {
        minS.opponents.push({
          name: p.name1,
          email: p.email1,
        })

        if (p.name2) {
          minS.opponents.push({
            name: p.name2,
            email: p.email2,
          })
        }
      } else {
        console.error('There is less than 3 sessions scheduled, therefore no authors cannot oppose')
      }
    })
  })

  for (let i = 0; i < 5; i++) {
    while (slots[i].length < 8) {
      // Nullobejct for a presentation
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
      slots[i].push(phony)
    }
  }
  slots.forEach((slot, i) => {
    // resolve day for each slot
    let day = 1
    switch (i) {
      case 0:
      case 1:
        day = 1
        break
      case 2:
      case 3:
        day = 2
        break
      case 4:
        day = 3
        break
    }

    // Go through all "phony" presentations and add starTime to them
    slot.forEach((row, idx) => {
      if (row.title !== 'Unscheduled Presentation') return
      row.time = idx + 8 + (idx + 8 > 11 ? 1 : 0)
      row.room = rooms[i]
      row.day = day
      rows.push(row)
    })
  })

  return rows
}
