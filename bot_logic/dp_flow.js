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
        this.filters = {}

        this.return_perfumes_brands_and_models_list()
            .then(concatenatedList => {
                this.brandModelList = concatenatedList;
                console.log(`Loaded ${concatenatedList.length} perfumes`);
            })
            .catch(error => {
                console.error('Failed to initialize perfume data:', error);
            });
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
            perfume_match: row.Nume_Produs,
            timp: row.Timp,
            sex: row.Sex,
            aroma_1: row.Aroma,
            aroma_2: row.AromaSecundara,
            intensitate: row.Intensitate,
            link: row.link
        }));
        return this.perfumes_brands_and_models;
    }


    /**
    * Returns a list of perfumes brands and models concatenated for user to type and 
    * select one of them
    * @returns {Array<string>} A list of strings with brand concatenated with model
    */
    async return_perfumes_brands_and_models_list() {
        const data = await this.process_csv('parfumuri.csv');
        
        // Store the full data in the class property for future reference
        this.perfumes_brands_and_models = data.map(row => ({
            brand: row.Brand,
            model: row.Model,
            perfume_match: row.Nume_Produs,
            timp: row.Timp,
            sex: row.Sex,
            aroma_1: row.Aroma,
            aroma_2: row.AromaSecundara,
            intensitate: row.Intensitate,
            link: row.link
        }));
        
        // Return just the concatenated brand and model strings
        return data.map(row => `${row.Brand} ${row.Model}`);
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
     */
    generate_perfume_list(perfumeNames) {
        const formattedPerfumes = perfumeNames.map(name => {
            const match = name.match(/[A-Z]{1,2}(?:-?\d{1,2})/);
            const urlCode = match ? match[0].toLowerCase() : '';    

            let link_value = `https://www.dpparfum.ro/produs/${urlCode}`
            if (name.toLowerCase().includes("private collection")) 
                link_value = `https://www.dpparfum.ro/produs/${urlCode}-private-collection/`
            if (name.toLowerCase().includes("arabian") && name.toLowerCase().includes("-")) 
                link_value = `https://www.dpparfum.ro/produs/${urlCode}-arabian/`
                return {
                    name: name,
                    link: link_value,
                    link_pic: this.select_url_from_name(name)
                };
            });

        return formattedPerfumes;
    }

    /**
     * Filters perfumes based on provided criteria
     * @returns {List} Filtered list of perfume names
     */
    select_perfumes() {
        if (!this.filters || !this.perfumes_brands_and_models) {
            return [];
        }
        
        const results = [];
        for (let perfume of this.perfumes_brands_and_models) {
            let match = true;
            for (let key in this.filters) 
            {
                if (!this.filters[key]) {
                    continue;
                }
                if (typeof this.filters[key] !== 'string') {
                    continue;
                }

                if (this.filters[key].toLowerCase() === "nu stiu" ||
                    this.filters[key].toLowerCase() === "nu știu") {
                    continue;
                }
                

                if (key === "sex") {
                    if (perfume['sex'].toLowerCase() == 'unisex')
                        continue
                    if (!((perfume['sex'].toLowerCase()).includes(this.filters[key].toLowerCase()))) {
                        match = false;
                        break;
                    }
                }

                if (key === "intensitate"){
                    if (!((perfume['intensitate'].toLowerCase()).includes(this.filters[key].toLowerCase()))) {
                        match = false;
                        break;
                    }
                }

                if (key === "aroma_2")
                {
                    if (!((perfume['aroma_1'].toLowerCase()).includes(this.filters[key].toLowerCase()))) {
                        match = false;
                        break;
                    }
                }
                
                if (key === "timp")
                {
                    if (!((perfume['timp'].toLowerCase()).includes(this.filters[key].toLowerCase()))) {
                        match = false;
                        break;
                    }
                }
            }
            
            if (match) {
                results.push(perfume.perfume_match);
            }
        }
        
        return results;

    }


    /**
     * Select perfume from brands_models collection
     * @param {Dictionary} filters - Filter criteria
     * @returns {List} Filtered list of perfume names
     */
    select_url_from_name(perfume_name) {
        if (!perfume_name) {
            return "https://dpparfum-1e60d.kxcdn.com/wp-content/uploads/2024/08/standard.webp";
        }
   
        // Find the perfume
        const matchingPerfume = this.perfumes_brands_and_models.find(entry => 
            entry.perfume_match.toLowerCase() === perfume_name.toLowerCase());

        // return url
        if (matchingPerfume && matchingPerfume.link) {
            return matchingPerfume.link;
        }

        return "https://dpparfum-1e60d.kxcdn.com/wp-content/uploads/2024/08/standard.webp";
    }

    /**
     * Select perfume url based on name
     * @param {string} name of perfume
     * @returns {string} Link URL to pic
     */
    select_perfume_from_brands_models(perfume_brand_model) {
        if (!perfume_brand_model) {
            console.warn('perfume_brand_model is null or undefined');
            return [];
        }
        
        // Check if brand and model properties exist
        if (!perfume_brand_model.brand || !perfume_brand_model.model) {
            console.warn('perfume_brand_model is missing brand or model property:', perfume_brand_model);
            return [];
        }
        
        const matchingPerfume = this.perfumes_brands_and_models.find(entry => 
            entry.brand.toLowerCase() === perfume_brand_model.brand.toLowerCase() && 
            entry.model.toLowerCase() === perfume_brand_model.model.toLowerCase()
        );

        if (matchingPerfume && matchingPerfume.perfume_match) {
            return [matchingPerfume.perfume_match];
        }
        return [];
    }


    /**
     * Processes user's answer and generates next output
     * @param {string} questionId - Current question ID
     * @param {string} answerId - Selected answer ID
     * @returns {Object|null} Next question output or null if conversation ends
     * @throws {Error} If question or answer ID is invalid
     */
     // TODO: rename perfume_brand_model in system_selection, selecting only one
     // TODO: expand this logic for cities
    processAnswer(questionId, answerId, perfume_brand_model=null) {
        const question = this.questions[questionId];
        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }

        const answer = question.answers[answerId] || question.answers["*"];
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
            this.filters['intensitate'] = answer.text;
            const recommendedPerfumes = this.select_perfumes();
            console.log(this.generate_perfume_list(recommendedPerfumes))
            return {
                question: this.generate_output(this.currentQuestion),
                system_options: {
                    output_list: this.generate_perfume_list(recommendedPerfumes)
                }
            };
        }

        // Recommendation of perfumes - last step
        if (this.currentQuestion === "recommendation_model_brand") {
            const recommendedPerfume = this.select_perfume_from_brands_models(perfume_brand_model);
            return {
                question: this.generate_output(this.currentQuestion),
                system_options: {
                    output_list: this.generate_perfume_list(recommendedPerfume)
                }
            };
        }


        // case when users type the perfume
        if (this.currentQuestion === "3.2.1") {
            if (answer.text.includes('Da')) 
            {   
                let return_val = {
                    question: this.generate_output(this.currentQuestion),
                    system_options: {
                        input_list: this.brandModelList
                    }
                };
                return return_val;
            }
                
            return {
                question: this.generate_output(this.currentQuestion),
            };
        }


        // Cases where we set the filters
        if (this.currentQuestion === "3.4" && this.currentQuestion !== "end") {
            if (answer.text.includes('zi')) 
                this.filters['timp'] = 'Zi';    
            else 
                this.filters['timp'] = 'Seara';    
            
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        if (this.currentQuestion === "3.5" && this.currentQuestion !== "end") {
            if (answer.text.includes('femei')) 
                this.filters['sex'] = 'Dama';    
            else 
                this.filters['sex'] = 'Barbati';    
            
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        if (this.currentQuestion === "3.5.1" ||
            this.currentQuestion === "3.5.2" ||
            this.currentQuestion === "3.5.3" ||
            this.currentQuestion === "3.5.4" ) {
            this.filters['aroma_1'] = answer.text;    
            
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        if (this.currentQuestion === "3.6" && this.currentQuestion !== "end") {
            this.filters['aroma_2'] = answer.text;    
            
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        if (this.currentQuestion === "3.6" && this.currentQuestion !== "end") {
            this.filters['intensitate'] = answer.text;    

            
            return {
                question: this.generate_output(this.currentQuestion)
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
            return {
                question: this.generate_output(this.currentQuestion),
            };
        }
        return null;
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