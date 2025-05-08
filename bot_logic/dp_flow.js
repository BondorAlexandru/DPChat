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
        this.perfumes_candidates = [];
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
        const seenModels = new Set();
        
        this.perfumes_brands_and_models = data
            .filter(row => {
                if (seenModels.has(row.Model)) return false;
                seenModels.add(row.Model);
                return true;
            })
            .map(row => ({
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

        this.perfumes_candidates = this.perfumes_brands_and_models;
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
    generate_output(questionId, filter_questions = null) {
        const question = this.questions[questionId];
        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }

        let answers_to_show = question.answers;
        if (filter_questions != null)
        {
            answers_to_show = [];
            for (let ans in question.answers){
                for (let i = 0; i < filter_questions.length; i++) {
                    if (question.answers[ans].text == filter_questions[i].text)
                        answers_to_show[ans] = filter_questions[i];
                }
            }
        }
        let next_question_to_show = {
            id: questionId,
            text: question.text,
            answers: Object.entries(answers_to_show).map(([id, answer]) => ({
                id,
                text: answer.text
            }))
        };
        console.log(next_question_to_show);
        return next_question_to_show
    }

    /**
     * Generates formatted output for a question
     * @param {string} questionId - ID of the question to generate output for
     */
    get_next_options(questionId, check_option_next_filter) {
        const question = this.questions[questionId];

        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }

        
        // console.log(question.answers[0])
        let keys_to_preserve = [];
        for (let key in question.answers) {

            let check_option_value = question.answers[key].text.toLowerCase();
            if(check_option_value.includes('femei')){
                check_option_value = 'femei';
            }
            if(check_option_value.includes('barbati')){
                check_option_value = 'barbati';
            }

            if(check_option_value.includes('nu stiu') ||
               check_option_value.includes('nu știu'))
            {
                keys_to_preserve.push(question.answers[key])
                continue;
            }

            for (let perfume of this.perfumes_candidates) {
                if (check_option_next_filter === "sex") {
                    if (((perfume['sex'].toLowerCase()).includes(check_option_value))) {
                        keys_to_preserve.push(question.answers[key])
                        break;
                    }
                }

                if (check_option_next_filter === "intensitate"){
                    if (((perfume['intensitate'].toLowerCase()).includes(check_option_value))) {
                        keys_to_preserve.push(question.answers[key])
                        break;
                    }
                }

                if (check_option_next_filter === "aroma_2")
                {
                    if (((perfume['aroma_1'].toLowerCase()).includes(check_option_value))) {
                        keys_to_preserve.push(question.answers[key])
                        break;
                    }
                }
                
                if (check_option_next_filter === "timp")
                {
                    if (((perfume['timp'].toLowerCase()).includes(check_option_value))) {
                        keys_to_preserve.push(question.answers[key])
                        break;
                    }
                }
            }
        }

        return keys_to_preserve;
    }


    /**
     * Generates a formatted list of recommended perfumes
     * @param {List} perfumes - List of perfume objects to format
     * @returns {List} Formatted list of perfume objects
     */
    generate_perfume_list(perfumeNames) {

        const seenLinks = new Set();
        const formattedPerfumes = []
        for (let perfume of perfumeNames)
        {
            let perfumeEntryRec = {};
            if(typeof perfume === 'string') {
                name = perfume.match(/[A-Z]{1,2}(?:-?\d{1,2})/);
            }
            else {
                name = perfume['perfume_match'].match(/[A-Z]{1,2}(?:-?\d{1,2})/);
            }
            
            const match = name.match(/[A-Z]{1,2}(?:-?\d{1,2})/);
            const urlCode = match ? match[0].toLowerCase() : '';    

            let link_value = `https://www.dpparfum.ro/produs/${urlCode}`
            if (name.toLowerCase().includes("private collection")) 
                link_value = `https://www.dpparfum.ro/produs/${urlCode}-private-collection/`
            if (name.toLowerCase().includes("arabian") && name.toLowerCase().includes("-")) 
                link_value = `https://www.dpparfum.ro/produs/${urlCode}-arabian/`
            perfumeEntryRec['name'] = name;
            perfumeEntryRec['link'] = link_value;
            perfumeEntryRec['link_pic'] = this.select_url_from_name(name);
            if (!seenLinks.has(link_value))
            {
                formattedPerfumes.push(perfumeEntryRec);   
            }
            seenLinks.add(link_value);
            
        }
        if (formattedPerfumes.length == 0)
        {   
            let perfumeEntryRec = {}
            perfumeEntryRec['name'] = "M15";
            perfumeEntryRec['link'] = "https://www.dpparfum.ro/exclusives-parfums/";
            perfumeEntryRec['link_pic'] = "https://dpparfum-1e60d.kxcdn.com/wp-content/uploads/2024/09/Slideshow-3-1000x1000.webp";
            formattedPerfumes.push(formattedPerfumes);
        }
        return formattedPerfumes;
    }

    /**
     * Filters perfumes based on provided criteria
     * @returns {List} Filtered list of perfume names
     */
    filter_out_perfumes(filter, filter_value) {
       console.log(filter)
       console.log(filter_value)

        const old_candidates = this.perfumes_candidates;
        const new_candidates = [];
        for (let perfume of old_candidates) {
            let match = false;
            if (!filter_value) {
                continue;
            }
            if (typeof filter_value !== 'string') {
                continue;
            }

            if (filter_value.toLowerCase() === "nu stiu" ||
                filter_value.toLowerCase() === "nu știu") {
                match = true;
                continue;
            }
            

            if (filter === "sex") {
                if (perfume['sex'].toLowerCase() == 'unisex')
                {
                    match = true;
                }
                if (((perfume['sex'].toLowerCase()).includes(filter_value.toLowerCase()))) {
                    match = true;
                }
            }

            if (filter === "intensitate"){
                if (((perfume['intensitate'].toLowerCase()).includes(filter_value.toLowerCase()))) {
                    match = true;
                }
            }

            if (filter === "aroma_2")
            {
                if (((perfume['aroma_1'].toLowerCase()).includes(filter_value.toLowerCase()))) {
                    match = true;
                }
            }
            
            if (filter === "timp")
            {
                if (((perfume['timp'].toLowerCase()).includes(filter_value.toLowerCase()))) {
                    match = true;
                }
            }
            
            if (match) {
                new_candidates.push(perfume);
            }
        }
        console.log(old_candidates)
        console.log(new_candidates)
        this.perfumes_candidates = new_candidates;
        return new_candidates;
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
        for (let perfume of this.perfumes_brands_and_models)
        {
            if (perfume.perfume_match.toLowerCase().includes(perfume_name.toLowerCase()))
                return perfume.link;
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
    processAnswer(questionId, answerId, perfume_brand_model=null) {
        const question = this.questions[questionId];
        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }
        if (answerId == 0)
            answerId = 1;
        console.log(question);
        console.log(answerId);
        console.log(question.answers[answerId]);

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
            // const recommendedPerfumes = this.select_perfumes();
            const recommendedPerfumes = this.filter_out_perfumes('intensitate', answer.text);
            console.log(this.perfumes_candidates);
            console.log(this.generate_perfume_list(recommendedPerfumes));
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

        // Cases where we set the filters
        if (this.currentQuestion === "2.1" && this.currentQuestion !== "end") {
            console.log(this.questions[this.currentQuestion]);
            return {
                question: this.generate_output(this.currentQuestion),
                system_options: {
                    input_list: this.questions[this.currentQuestion].system_options
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
            {
                this.filters['timp'] = 'Zi';    
                this.filter_out_perfumes('timp', 'Zi');
            } 
            else {
                this.filters['timp'] = 'Seara';    
                this.filter_out_perfumes('timp', 'Seara');
            }
            
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        if (this.currentQuestion === "3.5" && this.currentQuestion !== "end") {
            if (answer.text.includes('femei'))
            {
                this.filters['sex'] = 'Dama';   
                this.filter_out_perfumes('sex', 'Dama');
            } 
            else {
                this.filters['sex'] = 'Barbati';   
                this.filter_out_perfumes('sex', 'Barbati'); 
            }
            
            return {
                question: this.generate_output(this.currentQuestion)
            };
        }

        if (this.currentQuestion === "3.5.1" ||
            this.currentQuestion === "3.5.2" ||
            this.currentQuestion === "3.5.3" ||
            this.currentQuestion === "3.5.4" ) {
            this.filters['aroma_1'] = answer.text;    
            let options = this.get_next_options(this.currentQuestion, 'aroma_2');
            
            return {
                question: this.generate_output(this.currentQuestion, options)
            };
        }

        if (this.currentQuestion === "3.6" && this.currentQuestion !== "end") {
            this.filters['aroma_2'] = answer.text;    
            this.filter_out_perfumes('aroma_2', answer.text);
            let options = this.get_next_options(this.currentQuestion, "intensitate");

            if (options.length == 2)
            {
                return {
                    question: this.generate_output("recommendation"),
                    system_options: {
                        output_list: this.generate_perfume_list(this.perfumes_candidates)
                    }
                };
            }

            return {
                question: this.generate_output(this.currentQuestion, options)
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
                question: this.generate_output(this.currentQuestion)
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