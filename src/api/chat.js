const db = require('../../db')

// Renders the chat page
const view = (req, res, next) => {
  res.render('chat')
  next()
}

// Returns all messages related to the currently logged in user
const getAllMessages = async (req, res, next) => {
  const userId = req.session.userId
  const rows = await db.getMessages(userId)

  // Categorize and map all message into conversations with other users
  // A map is temporarily used as the accumulator as that makes O(n) runtime possible
  const mappedData = rows.reduce((acc, curr) => {
    const sentByMe = (curr.fromUserId === userId)
    const otherId = sentByMe ? curr.toUserId : curr.fromUserId
    let convo = acc.get(otherId)

    // This is the first message with this user, add conversation object to map
    if (!convo) {
      convo = {
        userId: otherId,
        name: sentByMe ? curr.toUserName : curr.fromUserName,
        messages: [],
        isChatRequest: !sentByMe,
      }
      acc.set(otherId, convo)
    }

    // Every conversation is treated as a chat request as long as logged in user has not responded at least once
    convo.isChatRequest = convo.isChatRequest && !sentByMe

    convo.messages.push({
      sentByMe,
      message: curr.message,
      createdAt: curr.createdAt,
    })

    return acc
  }, new Map())

  // Flatten map and return all conversation objects
  res.status(200).json([...mappedData.values()])
  next()
}

// Creates a chat message from logged in user to given user
const createMessage = async (req, res, next) => {
  const fromUserId = req.session.userId
  const { toUserId, message, redirect = true } = req.body

  await db.createMessage(fromUserId, toUserId, message)

  // This endpoint is consumed by two client; one wants redirect (profile) and one does not as it uses ajax requests (chat)
  if (redirect) {
    res.redirect('profile/' + toUserId)
  } else {
    res.status(201).send(true)
  }
  next()
}

module.exports = {
  view,
  getAllMessages,
  createMessage,
}
