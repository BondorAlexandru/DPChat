/**
 * PerfumeChatbot - A chatbot class for perfume recommendations
 * @class
 */
export default class PerfumeChatbot {
    /**
     * Creates a new PerfumeChatbot instance
     * @constructor
     * @param {string} userId - Unique identifier for the current user
     */
    constructor(userId) {
        this.userId = userId;
        this.questions = {};
        this.currentQuestion = "1";
        this.conversationHistory = [];
        this.perfumes = [];
        this.perfumes_brands_and_models = [];
    }

    /**
     * Loads questions from a JSON file
     * @async
     * @param {string} questionsFile - Path to the JSON file containing questions
     * @throws {Error} If file cannot be loaded or parsed
     * @returns {Promise<void>}
     * 
     */
    async process_questions(questionsFile='questions.json') {
        try {
            const response = await fetch(questionsFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.questions = data.questions;
        } catch (error) {
            throw new Error(`Error loading questions: ${error.message}`);
        }
    }


    /**
     * Utility function - Processes a line in CSV file
     * @async
     * @param {string} line - String of line 
     * @returns {value} Array of values from csv line
     */
    parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (insideQuotes && line[i + 1] === '"') {
                    currentValue += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        values.push(currentValue.trim());
        return values;
    }


    /**
     * Utility function - Processes a CSV file containing perfume data
     * @async
     * @param {string} csvFile - Path to the CSV file containing perfume data
     * @returns {Promise<Array>} Array of perfume objects
     */
    async process_csv(csvFile) {
        try {
            const response = await fetch(csvFile);
            const fileContent = await response.text();
            
            const lines = fileContent
                .replace(/^\uFEFF/, '') 
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length < 2) {
                throw new Error('CSV file must contain at least headers and one data row');
            }

            const headers = this.parseCSVLine(lines[0]);
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                
                if (values.length !== headers.length) {
                    console.warn(`Skipping line ${i + 1}: Invalid number of values`);
                    continue;
                }

                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }

            return data;
        } catch (error) {
            console.error('Error processing CSV:', error);
            throw new Error(`Failed to process CSV: ${error.message}`);
        }
    }   


    /**
     * Returns a list of perfumes brands and models for user to type it and 
     * select one of them
     * @returns {List} A list of dictionaries with brand and model
     */
    async return_perfumes_brands_and_models() {
        const data = await this.process_csv('parfumuri.csv');  
        this.perfumes_brands_and_models = data.map(row => ({
            brand: row.Brand,
            model: row.Model,
            perfume_match: row.Nume_Produs
        }));
        console.log(this.perfumes_brands_and_models);
        return this.perfumes_brands_and_models;
    }


    /**
     * Generates formatted output for a question
     * @param {string} questionId - ID of the question to generate output for
     * @returns {Object} Formatted question object with id, text, and answers
     * @throws {Error} If question ID is not found
     */
    generate_output(questionId) {
        const question = this.questions[questionId];
        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }

        return {
            id: questionId,
            text: question.text,
            answers: Object.entries(question.answers).map(([id, answer]) => ({
                id,
                text: answer.text
            }))
        };
    }


    /**
     * Generates a formatted list of recommended perfumes
     * @param {List} perfumes - List of perfume objects to format
     * @returns {List} Formatted list of perfume objects
     * 
     * @TODO: Implement a way to get the pics?
     */
    generate_perfume_list(perfumeNames) {
        const formattedPerfumes = perfumeNames.map(name => {
            const match = name.match(/[A-Z]\d{1,2}/);
            const urlCode = match ? match[0].toLowerCase() : '';
            
                return {
                    name: name,
                    link: `https://www.dpparfum.ro/produs/${urlCode}`,
                    link_pic: "https://dpparfum-1e60d.kxcdn.com/wp-content/uploads/2024/09/UPSTARRUS-STANDARD-800x800.webp"
                };
            });

        return formattedPerfumes;
    }

    /**
     * Filters perfumes based on provided criteria
     * @param {Dictionary} filters - Filter criteria
     * @returns {List} Filtered list of perfume names
     */
    select_perfumes(filters) {

        const matches = ['M15', 'M16', 'D5']
        return matches;
    }


    /**
     * Select perfume from brands_models collection
     * @param {Dictionary} filters - Filter criteria
     * @returns {List} Filtered list of perfume names
     */
    select_perfume_from_brands_models(perfume_brand_model) {
        
        const matchingPerfume = this.perfumes_brands_and_models.find(entry => 
            entry.brand.toLowerCase() === perfume_brand_model.brand.toLowerCase() && 
            entry.model.toLowerCase() === perfume_brand_model.model.toLowerCase()
        );

        if (matchingPerfume && matchingPerfume.perfume_match) {
            return [matchingPerfume.perfume_match];
        }

        console.warn('No matching perfume found for:', perfume_brand_model);
        return [];
    }


    /**
     * Processes user's answer and generates next output
     * @param {string} questionId - Current question ID
     * @param {string} answerId - Selected answer ID
     * @returns {Object|null} Next question output or null if conversation ends
     * @throws {Error} If question or answer ID is invalid
     */
    processAnswer(questionId, answerId, perfume_brand_model=null) {
        const question = this.questions[questionId];
        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }

        const answer = question.answers[answerId] || question.answers["*"];
        console.log(question)
        console.log(answer)
        if (!answer) {
            throw new Error(`Invalid answer ${answerId} for question ${questionId}`);
        }

        this.conversationHistory.push({
            userId: this.userId,
            timestamp: new Date().toISOString(),
            questionId,
            question: question.text,
            answerId,
            answerText: answer.text
        });

        this.currentQuestion = answer.nextQuestion;

        // Recommendation of perfumes - last step
        if (this.currentQuestion === "recommendation") {
            const filters = this.extractFiltersFromHistory();
            const recommendedPerfumes = this.select_perfumes(filters);
            console.log(this.generate_output(this.currentQuestion))
            console.log(this.generate_perfume_list(recommendedPerfumes))
            return {
                question: this.generate_output(this.currentQuestion),
                perfumes: this.generate_perfume_list(recommendedPerfumes)
            };
        }

        // case when users type the perfume
        if (this.currentQuestion === "recommendation_model_brand") {
            const recommendedPerfume = this.select_perfume_from_brands_models(perfume_brand_model);
            console.log(this.generate_output(this.currentQuestion))
            console.log(this.generate_perfume_list(recommendedPerfume))
            return {
                question: this.generate_output(this.currentQuestion),
                perfumes: this.generate_perfume_list(recommendedPerfume)
            };
        }

        // all other cases
        if (this.currentQuestion && this.currentQuestion !== "end") {
            console.log(this.currentQuestion)
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        // case when conversation ends
        if (this.currentQuestion === "end") {
            console.log(this.currentQuestion)
            return {
                question: this.generate_output(this.currentQuestion),
            };
        }
        console.log('null')
        return null;
    }

    /**
     * Extracts filter criteria from conversation history
     * @private
     * @returns {Object} Filter criteria based on user's answers
     */
    extractFiltersFromHistory() {
        const filters = {};    
        return filters;
    }

    /**
     * Retrieves conversation history
     * @param {string} [userId=null] - Optional user ID to filter history
     * @returns {List} List of conversation interactions
     * 
     */
    getHistory(userId = null) {
        if (userId) {
            return this.conversationHistory.filter(
                interaction => interaction.userId === userId
            );
        }
        return this.conversationHistory;
    }

    /**
     * Restarts the conversation
     * @returns {Object} Initial question output
     */
    restart() {
        this.currentQuestion = "1";
        this.conversationHistory = [];
        return this.generate_output(this.currentQuestion);
    }
}