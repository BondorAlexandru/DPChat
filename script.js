// Import the bot server
import BotServer from './bot_server.js';

// Array to store all chat messages (can later be replaced or synced with your backend)
let chatHistory = [];
let botServer = new BotServer();
let currentQuestionId = null; // Track the current question ID

// Initialize the bot server when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize bot server
  await botServer.init();
  
  // Rest of your existing DOM content loaded code...
  const cards = document.querySelectorAll('.card');
  const backIcon = document.getElementById('back-icon');
  const headerText = document.getElementById('header-text');
  const defaultMessage = 'Bună ziua!<br>Cu ce vǎ putem ajuta?';

  // Handle click on a card to expand it and update header styles.
  cards.forEach((card) => {
    card.addEventListener('click', function(e) {
      // Only expand if this card isn't already expanded.
      if (!this.classList.contains('expanded')) {
        // Prepare chat content before visual transition
        const chatMessagesId = this.querySelector('.chat-messages').id;
        let context = '';
        if (chatMessagesId === 'chat-messages1') context = 'parfum';
        else if (chatMessagesId === 'chat-messages2') context = 'comanda';
        else if (chatMessagesId === 'chat-messages3') context = 'magazin';
        
        // Add a system welcome message with options
        const response = botServer.getResponse("", context);
        currentQuestionId = response.questionId;
        
        // Hide other cards immediately
        cards.forEach(c => {
          if (c !== this) {
            c.style.display = 'none'; // Instant hide
          }
        });
        
        // Update header text immediately
        const title = this.getAttribute('data-title') || 'Chat';
        headerText.innerHTML = title;
        
        // Show the back icon and apply expanded header styles immediately
        backIcon.style.display = 'block';
        document.querySelector('.chat-header').classList.add('expanded-header');
        
        // Apply expanding class for smooth growth from baseline
        this.classList.add('expanding');
        
        // Add the message immediately instead of waiting
        addMessage(response, 'system', chatMessagesId);
        
        // After transition completes, complete the expansion
        setTimeout(() => {
          this.classList.add('expanded');
          this.style.display = 'flex'; // Ensures the card remains visible
        }, 600); // Transition time
      }
    });
  });

  // Use the back icon to collapse the expanded card and revert header adjustments.
  backIcon.addEventListener('click', function() {
    // Find the expanded card
    const expandedCard = document.querySelector('.card.expanded');
    
    // Remove expanded class
    if (expandedCard) {
      expandedCard.classList.remove('expanded');
      expandedCard.classList.remove('expanding');
    }
    
    // Show all cards again and remove fade-out class
    cards.forEach(c => {
      c.style.display = 'flex';
      c.classList.remove('fade-out');
    });
    
    // Update header text back to default
    headerText.innerHTML = 'Bună ziua!<br />Cu ce vǎ putem ajuta?';
    
    // Hide back icon and reset header style
    backIcon.style.display = 'none';
    document.querySelector('.chat-header').classList.remove('expanded-header');
  });

  // Set current date for all date spans.
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
  
  document.querySelectorAll('#current-date').forEach(el => {
    el.textContent = formatDateInRomanian(today);
  });

  // Chat toggle functionality
  const chatToggleButton = document.getElementById('chat-toggle-button');
  const chatContainer = document.querySelector('.chat-container');
  const toggleIcon = document.getElementById('toggle-icon');
  const assistantLabel = document.getElementById('chat-assistant-label');
  
  // Set initial state - chat hidden by default, label visible
  chatContainer.classList.add('hidden');
  
  // Show the label with a slight delay for initial load
  setTimeout(() => {
    assistantLabel.classList.add('visible');
  }, 300);
  
  // Toggle chat visibility when the button is clicked
  chatToggleButton.addEventListener('click', function() {
    const isChatVisible = !chatContainer.classList.contains('hidden');
    
    if (isChatVisible) {
      // Hide chat with animation
      chatContainer.classList.add('hidden');
      toggleIcon.src = 'img/icons/openButton.svg';
      toggleIcon.alt = 'Open Chat';
      chatToggleButton.classList.remove('active');
      
      // Show the label with a slight delay for better animation
      setTimeout(() => {
        assistantLabel.classList.add('visible');
      }, 100);
    } else {
      // Show chat with animation
      chatContainer.classList.remove('hidden');
      toggleIcon.src = 'img/icons/closeButton.svg';
      toggleIcon.alt = 'Close Chat';
      chatToggleButton.classList.add('active');
      
      // Hide the label immediately
      assistantLabel.classList.remove('visible');
      
      // Reset the chat if it was in an expanded state
      const expandedCard = document.querySelector('.card.expanded');
      if (expandedCard) {
        // Simulate click on back button to return to main menu
        document.getElementById('back-icon').click();
      }
    }
  });
  
});

 // Function to handle when a user clicks an option button
function handleOptionClick(optionText, chatId) {
  // Add the selected option as a user message
  addMessage(optionText, 'user', chatId);
}

// Update the addMessage function to handle bot responses with options
async function addMessage(messageData, type = 'user', chatId) {
  // Extract text from messageData (which could be a string or an object)
  const text = typeof messageData === 'string' ? messageData : messageData.text;
  console.log(`addMessage: Adding a ${type} message to container with id "${chatId}"`);
  
  // Add the message to our chat history array
  chatHistory.push({ text, type });
  
  const chatMessages = document.getElementById(chatId);
  if (!chatMessages) {
    console.error(`addMessage: No chat container found with id "${chatId}".`);
    return;
  }
  
  // Create message div
  const messageDiv = document.createElement('div');
  messageDiv.className = type + '-message';
  
  // If this is a system message and has system_options, include the dropdown inside the message
  if (type === 'system' && typeof messageData === 'object' && messageData.system_options) {
    const systemOptions = messageData.system_options;
    
    if (systemOptions.input_list && systemOptions.input_list.length > 0) {
      // Add the class for wider system messages with dropdown
      messageDiv.classList.add('system-message-with-dropdown');
      
      // Add the message text
      messageDiv.innerHTML = `<span>${text}</span>`;
      
      // Create dropdown container inside the message
      const dropdownContainer = document.createElement('div');
      dropdownContainer.className = 'system-dropdown-container';
      
      // Create input for filtering
      const inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.className = 'dropdown-input';
      inputField.placeholder = 'Vă rugăm tastați numele...';
      
      // Create dropdown list container
      const dropdownList = document.createElement('div');
      dropdownList.className = 'dropdown-list';
      // Initially hide the dropdown
      dropdownList.style.display = 'none';
      
      // Function to render the options based on filter
      const renderOptions = (filter = '') => {
        // Only show dropdown if filter has content
        if (filter.length > 0) {
          dropdownList.style.display = 'block';
          
          dropdownList.innerHTML = '';
          const filteredOptions = systemOptions.input_list.filter(option => 
            option.toLowerCase().includes(filter.toLowerCase())
          );
          
          filteredOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'dropdown-option';
            optionElement.textContent = option;
            
            // Handle option selection
            optionElement.addEventListener('click', () => {
              inputField.value = option;
              
              // Visually show selection
              dropdownList.querySelectorAll('.dropdown-option').forEach(el => {
                el.classList.remove('selected');
              });
              optionElement.classList.add('selected');
              
              // Submit the selected option after a brief delay
              setTimeout(() => {
                // Remove the dropdown container from the message
                messageDiv.removeChild(dropdownContainer);
                
                // Process the selected option
                handleOptionClick(option, chatId);
              }, 300);
            });
            
            dropdownList.appendChild(optionElement);
          });
        } else {
          // Hide dropdown when input is empty
          dropdownList.style.display = 'none';
        }
      };
      
      // Initial render - dropdown should be hidden because input is empty
      renderOptions('');
      
      // Handle input changes for filtering
      inputField.addEventListener('input', (e) => {
        renderOptions(e.target.value);
      });
      
      // Append elements to container
      dropdownContainer.appendChild(inputField);
      dropdownContainer.appendChild(dropdownList);
      
      // Append the dropdown container to the message div
      messageDiv.appendChild(dropdownContainer);
      
      // Append the message div to the chat messages container
      chatMessages.appendChild(messageDiv);
      
      // Focus the input field
      setTimeout(() => inputField.focus(), 100);
    } else {
      // If there are no input_list options, just display the regular message
      messageDiv.innerHTML = `<span>${text}</span>`;
      chatMessages.appendChild(messageDiv);
    }
  }
  // If this is a system message and has regular options, display them
  else if (type === 'system' && typeof messageData === 'object' && messageData.options && messageData.options.length > 0) {
    // Add the message text
    messageDiv.innerHTML = `<span>${text}</span>`;
    chatMessages.appendChild(messageDiv);
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'message-options';
    
    messageData.options.forEach(option => {
      if (option.text !== "End") { // Skip "End" options
        const optionButton = document.createElement('button');
        optionButton.className = 'option-button';
        optionButton.textContent = option.text;
        optionButton.addEventListener('click', () => {
          // Remove options once clicked
          chatMessages.removeChild(optionsDiv);
          
          // Process the selected option
          handleOptionClick(option.text, chatId);
        });
        optionsDiv.appendChild(optionButton);
      }
    });
    
    chatMessages.appendChild(optionsDiv);
  }
  else {
    // Regular message without options
    messageDiv.innerHTML = `<span>${text}</span>`;
    chatMessages.appendChild(messageDiv);
  }
  
  // Auto-scroll to the latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // If this is a user message, get bot response
  if (type === 'user' && text !== '') {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'system-message loading';
    loadingDiv.innerHTML = '<span>...</span>';
    chatMessages.appendChild(loadingDiv);
    
    try {
      // Use the local bot server instead of making an HTTP request
      setTimeout(() => {
        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);
        
        // Get response from bot server with current question context
        const botResponse = botServer.getResponse(text, '', currentQuestionId);
        
        // Update current question ID
        if (botResponse.questionId) {
          currentQuestionId = botResponse.questionId;
        }
        
        // Add bot response
        addMessage(botResponse, 'system', chatId);
      }, 500); // Simulate a little delay for realism
    } catch (error) {
      console.error('Error getting bot response:', error);
      // Remove loading indicator
      chatMessages.removeChild(loadingDiv);
      // Add error message
      addMessage('Sorry, I encountered an error processing your request.', 'system', chatId);
    }
  }
}

// Existing functionality for the main chat inputs inside each card:
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
