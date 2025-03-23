/**
 * Simple bot server implemented in JavaScript
 * This replaces the need for the Python Flask server
 */
class BotServer {
  constructor() {
    // Load questions from questions.json later
    this.questions = null;
  }

  async init() {
    try {
      const response = await fetch('bot_logic/questions.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.questions = data.questions;
      console.log('Bot server initialized with questions');
      return true;
    } catch (error) {
      console.error('Error initializing bot server:', error);
      return false;
    }
  }

  // Simple bot logic to handle different contexts and questions
  getResponse(userMessage, context, currentQuestionId = null) {
    // Default response if something fails
    let defaultResponse = { 
      text: "Nu am înțeles întrebarea. Cum vă pot ajuta?",
      options: [] 
    };
    
    try {
      if (!this.questions) {
        return { text: "Sistemul nu a fost inițializat corect. Vă rugăm încercați din nou.", options: [] };
      }
      
      // If we have a currentQuestionId, use that to find the next question
      if (currentQuestionId && userMessage) {
        const currentQuestion = this.questions[currentQuestionId];
        if (!currentQuestion) {
          return defaultResponse;
        }
        
        // Find the answer that matches the user's selection
        for (const [answerId, answer] of Object.entries(currentQuestion.answers)) {
          if (answer.text === userMessage) {
            // Found the matching answer, get the next question
            const nextQuestionId = answer.nextQuestion;
            if (nextQuestionId === "end" || nextQuestionId === null) {
              return { 
                text: "Vă mulțumim pentru că ați ales serviciile noastre! Mai putem să vă ajutăm cu ceva?",
                options: [
                  { id: "1", text: "Da" },
                  { id: "2", text: "Nu" }
                ]
              };
            }
            
            const nextQuestion = this.questions[nextQuestionId];
            if (nextQuestion) {
              // Return next question with its answer options
              return {
                text: nextQuestion.text,
                questionId: nextQuestionId,
                options: Object.entries(nextQuestion.answers).map(([id, ans]) => ({ 
                  id: id, 
                  text: ans.text 
                }))
              };
            }
          }
        }
      }
      
      // Handle different contexts for initial questions
      let initialQuestionId;
      switch (context) {
        case 'parfum':
          initialQuestionId = "3.1";
          break;
        case 'comanda':
          initialQuestionId = "1.1";
          break;
        case 'magazin':
          initialQuestionId = "2.1";
          break;
        default:
          initialQuestionId = "1";
      }
      
      const initialQuestion = this.questions[initialQuestionId];
      return {
        text: initialQuestion.text,
        questionId: initialQuestionId,
        options: Object.entries(initialQuestion.answers).map(([id, ans]) => ({ 
          id: id, 
          text: ans.text 
        }))
      };
      
    } catch (error) {
      console.error('Error getting bot response:', error);
      return defaultResponse;
    }
  }
}

// Export for use in other files
export default BotServer; 