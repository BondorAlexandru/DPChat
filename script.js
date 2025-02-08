// Array to store all chat messages (can later be replaced or synced with your backend)
let chatHistory = [];

// Render all messages from chatHistory into the chat-messages container
function renderMessages() {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = ''; // Clear previous messages

  chatHistory.forEach((message) => {
    const messageDiv = document.createElement('div');
    // The CSS classes (e.g. user-message or system-message) allow for different styling
    messageDiv.className = message.type + '-message';
    messageDiv.innerHTML = `<span>${message.text}</span>`;
    chatMessages.appendChild(messageDiv);
  });

  // Auto-scroll to the latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add a new message (of type 'user' or 'system') and update the view
function addMessage(text, type = 'user', chatId) {
  console.log(`addMessage: Adding a ${type} message to container with id "${chatId}"`);
  // Add the message to our chat history array
  chatHistory.push({ text, type });
  
  const chatMessages = document.getElementById(chatId);
  if (!chatMessages) {
    console.error(`addMessage: No chat container found with id "${chatId}".`);
    return;
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = type + '-message';
  messageDiv.innerHTML = `<span>${text}</span>`;
  chatMessages.appendChild(messageDiv);
  
  // Auto-scroll to the latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  console.log("addMessage: Message added successfully.");
}

// ---------------------------------------------------------
// NEW / UPDATED CODE FOR CARD-BASED CHAT NAVIGATION
// ---------------------------------------------------------

// Improved card-based chat navigation
document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.card');
  const backIcon = document.getElementById('back-icon');
  const headerText = document.getElementById('header-text');
  const defaultMessage = 'Bună ziua!<br>Cu ce vǎ putem ajuta?';

  // Handle click on a card to expand it and update header styles.
  cards.forEach((card) => {
    card.addEventListener('click', function(e) {
      // Only expand if this card isn't already expanded.
      if (!this.classList.contains('expanded')) {
        // Hide other cards.
        cards.forEach(c => {
          if (c !== this) {
            c.style.display = 'none';
          }
        });
        // Expand the clicked card.
        this.classList.add('expanded');
        this.style.display = 'flex'; // Ensures the card remains visible.
        
        // Update header text using card's data-title attribute.
        const title = this.getAttribute('data-title') || 'Chat';
        headerText.innerHTML = title;
        
        // Show the back icon and apply expanded header styles.
        backIcon.style.display = 'block';
        document.querySelector('.chat-header').classList.add('expanded-header');
      }
    });
  });

  // Use the back icon to collapse the expanded card and revert header adjustments.
  backIcon.addEventListener('click', () => {
    const expandedCard = document.querySelector('.card.expanded');
    if (expandedCard) {
      // Collapse the expanded card.
      expandedCard.classList.remove('expanded');
      // Show all cards again.
      cards.forEach(c => {
        c.style.display = 'flex';
      });
      // Reset header text and hide the back icon.
      headerText.innerHTML = defaultMessage;
      backIcon.style.display = 'none';
      document.querySelector('.chat-header').classList.remove('expanded-header');
    }
  });

  // Set current date for all date spans.
  // Note: Consider using a class (e.g., "current-date") in place of an ID if there is more than one.
  const today = new Date();
  function formatDateInRomanian(date) {
    const months = [
      "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
      "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }
  // If using IDs, be aware this only updates the first occurrence.
  // To update all elements, you can either change the HTML to use classes or use querySelectorAll.
  document.querySelectorAll('#current-date').forEach(el => {
    el.textContent = formatDateInRomanian(today);
  });
});

// ---------------------------------------------------------
// Existing functionality for the main chat inputs inside each card:
// (They work much as before, but now inside each card's own chat-content)
// ---------------------------------------------------------

document.getElementById('send-user-message1').addEventListener('click', () => {
  const messageInput = document.getElementById('user-message-input1');
  const text = messageInput.value.trim();
  
  if (text !== '') {
    addMessage(text, 'user', 'chat-messages1');
    messageInput.value = ''; // Clear the input field after sending
  }
});

document.getElementById('send-user-message2').addEventListener('click', () => {
  const messageInput = document.getElementById('user-message-input2');
  const text = messageInput.value.trim();
  
  if (text !== '') {
    addMessage(text, 'user', 'chat-messages2');
    messageInput.value = ''; // Clear the input field after sending
  }
});

document.getElementById('send-user-message3').addEventListener('click', () => {
  const messageInput = document.getElementById('user-message-input3');
  const text = messageInput.value.trim();
  
  if (text !== '') {
    addMessage(text, 'user', 'chat-messages3');
    messageInput.value = ''; // Clear the input field after sending
  }
});

// Optional tool buttons for testing messages:
document.getElementById('lorem-user').addEventListener('click', () => {
  // Try to get the expanded card.
  let expandedCard = document.querySelector('.card.expanded');
  let chatMessagesId;
  console.log(expandedCard);
  if (expandedCard) {
    // Use the chat messages container from expanded card.
    chatMessagesId = expandedCard.querySelector('.chat-messages').id;
  } else {
    // Fall back to a default container (e.g., card1).
    chatMessagesId = 'chat-messages1';
  }
  
  addMessage(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "user",
    chatMessagesId
  );
});

document.getElementById('lorem-system').addEventListener('click', () => {
  const expandedCard = document.querySelector('.card.expanded');
  if (expandedCard) {
    const chatMessagesId = expandedCard.querySelector('.chat-messages').id;
    addMessage("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "system", chatMessagesId);
  }
});