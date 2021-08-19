const selectors = {
  messageContainer: 'ul.contain',
  conversationContainer: '#left',
}

let selectedUserId = null
const data = new Map()

const getSelectedConversation = () => {
  return data.get(selectedUserId) || { messages: [] }
}

// Get all conversations, sorted and categorized
const getConversions = () => {
  return [...data.values()].map(row => ({
    userId: row.userId,
    name: row.name,
    isChatRequest: row.isChatRequest,
  })).sort((a, b) => {
    if (a.isChatRequest === b.isChatRequest) {
      return a.name.localeCompare(b.name)
    } else {
      return a.isChatRequest ? 1 : -1
    }
  })
}

const updateConversations = (newData) => {
  // This will NOT report changed if conversation is deleted (not a feature anyways)
  let noChanges = true
  newData.forEach(d => {
    d.messages.forEach(m => {
      m.createdAt = new Date(m.createdAt).toLocaleString()
    })

    noChanges = noChanges && JSON.stringify(data.get(d.userId)) === JSON.stringify(d)
    data.set(d.userId, d)
  })
  return noChanges
}

const render = () => {
  let messageContainer = document.querySelector(selectors.messageContainer)
  messageContainer.innerHTML = '' // Reset current view

  // Creates all message bubbles for currently open conversation
  getSelectedConversation().messages.forEach(m => {
    const el = document.createElement('li')
    el.innerText = m.message
    el.classList.add(m.sentByMe ? 'me' : 'him')
    el.setAttribute('data-toggle', 'tooltip')
    el.setAttribute('title', m.createdAt)
    el.setAttribute('data-placement', m.sentByMe ? 'left' : 'right')

    messageContainer.appendChild(el)
  })

  const conversationContainer = document.querySelector(selectors.conversationContainer)
  conversationContainer.innerHTML = '' // Reset current view

  let dividerAdded = false

  // Renders and categorizes all conversations
  getConversions().forEach(d => {
    if (!dividerAdded && d.isChatRequest) {
      dividerAdded = true
      const divider = document.createElement('li')
      divider.classList.add('list-group-item')
      divider.innerHTML = '<strong>Chat requests</strong>'
      conversationContainer.appendChild(divider)
    }

    const el = document.createElement('li')
    el.innerText = d.name

    el.classList.add('list-group-item')
    if (d.userId === selectedUserId) {
      el.classList.add('active')
    }

    // When clicking on a specific conversation, it should render all messages in that specific conversation
    el.addEventListener('click', () => {
      selectedUserId = d.userId
      $('#messageInput').show()
      render()
    })

    conversationContainer.appendChild(el)
  })

  // This needs to be reselected as its height most likely changed
  messageContainer = document.querySelector(selectors.messageContainer)
  // Scroll to bottom
  messageContainer.scrollTop = messageContainer.scrollHeight

  $('[data-toggle="tooltip"]').tooltip({ // Show all tooltips
    placement: 'top',
  })
}

// Fetch messages from the server and rerender if any changes occurred
const fetchMessages = async () => {
  const updatedData = await fetch('/chat-messages')
    .then(response => response.json())
  const noChanges = updateConversations(updatedData)
  if (!noChanges) {
    render()
  }
}

// Immediately fetch messages upon loading the page
fetchMessages()

// Fetch messages every 5 seconds
setInterval(fetchMessages, 5000)

// Sends message to given user id
const sendMessage = async (toUserId, message) => {
  await fetch('/chat-messages', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ toUserId, message, redirect: false }),
  })
}

// We need to makes sure DOM is loaded before adding listeners to its elements
$(document).ready(() => {
  const input = $('#messageInput')
  input.hide()

  input.on('keydown', e => {
    // Enter pressed
    if (e.key === 'Enter' || e.keyCode === 13) {
      // Bar is actually filled with some input
      if (e.target.value !== '' && e.target.value !== null) {
        sendMessage(selectedUserId, e.target.value)
          .then(() => fetchMessages())
        e.target.value = ''
      }
    }
  })
})
