import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(`postgres://${process.env.DB_USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(<string>process.env.PORT, 10)}/${process.env.DB}`);

/* --------------------------------------------------------------------------- */
export class dbUtils {
    // Convert email to user_id. Returns integer if found, null otherwise.
     async getUserIDbyEmail(email: string){
        try {
            const users = await sql`SELECT user_id FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
            return users.length ? users[0]['user_id'] : null;
        }
        catch (error) {
            throw error;
        }
    }

    // Convert email to user_id. Returns string if found, null otherwise.
     async getEmailbyUserID(user_id: number){
        try {
            const users = await sql`SELECT * FROM users WHERE user_id = ${user_id};`;
            return users.length ? users[0]['email'] : null;
        }
        catch (error) {
            throw error;
        }
    }

    // Check if user email exists. Return false otherwise.
     async loginUserCheck(email: string) {
        try {
            const users = await sql`SELECT * FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
            return users.length ? true : false;
        }
        catch (error) {
            throw error;
        }
    }

     async updateLastLoggedIn(userID: number){
        try{
            await sql`UPDATE users SET last_login_date = NOW() WHERE user_id = ${userID};`;
        }
        catch(error){
            throw error;
        }
    }

    //get hashed password for a user
     async getHashedPasswordFromDatabase(email: string) {
        try {
            const password = await sql`SELECT pass FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
            return password[0]['pass'];//return the password string
        }
        catch (error) {
            throw error;
        }
    }

    // Add user into users table based on placeholder values and the email parameter.
     async signupUser(email: string, hashedPassword: string) {
        try {
            if(await this.loginUserCheck(email) != true){//if name isnt already present
                await sql`INSERT INTO users (username, first_name, last_name, email, pass, is_admin) VALUES ('placeholder', 'John', 'Appleseed', TRIM(both '"' from ${email}), ${hashedPassword}, false)`;
                return true;
            }
            else{
                console.log(`email: ${email} already in use`);
                throw new Error(`Email already in use`);
            }
        }
        catch (error) {
            throw error;
        }
    }

    // Login User via GET request
     async getUser(email: string) {
        try {
            return this.loginUserCheck(email);
        }
        catch (error) {
            throw error
        }
    }

    // Signup User via POST request with email
     async signup(email: string, hashedPassword: string) {
        try {
            if (!await this.getUser(email)) {
                return await this.signupUser(email,hashedPassword);
            }
            return false;
        }
        catch (error) {
            throw error
        }
    }

    // get classes by user from email.
     async getClasses(user_id: number) {
        try {
            const users = user_id;
            if (users) {
                const results = await sql`SELECT * FROM class WHERE author_id = ${users};`
                return results;
            }
            else {
                
                //throw new Error('User not found');
                return null;
            }
        }
        catch (error) {
            throw error;
        }
    }

    // post classes by user from email. Input: email, class code
     async createClass(user_id: number, session: number, year: number, title: string, code: string) {
        try {
            const users = user_id;
            //we should probably add some sort of class already exists protection in future
            if (users)
            {
                await sql`INSERT INTO class (author_id, session, year, title, code, creation_date, expiry_date) VALUES
                                            (${users}, ${session}, ${year}, TRIM(both '"' from ${title}), TRIM(both '"' from ${code}), NOW(), NOW() + '1 year');`;//the TRIM bit is because this has "" on it because typescript/javascript
                return true;
            }
            else 
                return false;
        }
        catch (error) {
            //throw error;
            return false;
        }
    }

    // get assignments based on class.
     async getAssignments(user_id: number, specificClass: number) {
        try {
            const users = user_id;
            if (users) {
                const verifyUser = await sql`SELECT author_id FROM class WHERE class_id = ${specificClass};`;
                if (verifyUser[0]['author_id'] === users) {
                    const results = await sql`SELECT * FROM assignments WHERE class_id = ${specificClass};`;
                    return results.length ? results : null;
                }
            }
            else {
                throw new Error('User not found');
            }
        }
        catch (error) {
            throw error;
        }
    }

    // post assignments based on class.
     async createAssignment(user_id: number, class_id: number, name: string, description: string) {
        try {
            const users = user_id;
            await sql`INSERT INTO assignments (class_id, name, description) VALUES (${class_id}, TRIM(both '"' from ${name}), TRIM(both '"' from ${description}));`;
            return true;
        }
        catch (error) {
            throw error;
        }
    }

    // get viva based on submissions JOIN viva_output
    // TO DO
     async getVivaForSubmission(user_id: number, specificSubmission: number, specificGenQ: number){
        try {
            const users = user_id;
            if (users) {
                //TO DO
            }
            else {
                throw new Error('User not found');
            }
        }
        catch (error) {
            throw error;
        }
    }

    // get specific submissions with submission_id
     async getSubmissionFilePathForSubID(specificSubmission: number){
        try {
            const submission = await sql`SELECT * FROM submissions WHERE submission_id = ${specificSubmission};`;
            const sPath = submission[0]['submission_filepath'];
            return sPath;
        }
        catch (error) {
            throw error;
        }
    }

    // get submissions with user, class, and assignment
     async getSubmissionsForAssignments(user_id: number, specificClass: number, specificAssignment: number){
        try {
            const users = user_id;
            if (users) {
                const verifyUser = await sql`SELECT author_id FROM class WHERE class_id = ${specificClass};`;
                if (verifyUser[0]['author_id'] === users) {	//verifying that the user is the one that owns this class			
                    const verifyClass = await sql`SELECT class_id FROM assignments WHERE assignment_id = ${specificAssignment};`
                    if (verifyClass[0]['class_id'] === specificClass) {//if the class we have verified the user has control over is the same as the one that corresponds to the assignments
                        const results = await sql`SELECT * FROM submissions WHERE assignment_id = ${specificAssignment};`;
                        return results.length ? results : null;
                    }
                }
            }
            else {
                throw new Error('User not found');
            }
        }
        catch (error) {
            throw error;
        }
    }

    // post submissions with document, class, placeholder student
     async createSubmission(user_id: number, assignment_id: number, student_id: number, submission_filepath: string) {
        try {
            const users = user_id;//not used, but will be used for verification
            await sql`INSERT INTO submissions (assignment_id, student_id, submission_date, submission_filepath) VALUES
                                        (${assignment_id}, ${student_id}, NOW(), TRIM(both '"' from ${submission_filepath}));`;//for NOW() to work correctly we need to do SET TIMEZONE with aus but leaving until later for now
            return true;
        }
        catch (error) {
            throw error;
        }
    }

    // internal query to  PDF file filepath
     async getPDFFile(student_id: number, assignment_id: number) {
        try {
            const result = await sql`SELECT submission_filepath FROM submissions 
                                        WHERE student_id = ${student_id}
                                        AND assignment_id = ${assignment_id};`;
            return result.length ? result[0]['submission_filepath'] : null;
        }
        catch (error) {
            throw error;
        }
    }

    // internal query to receive generated questions in jsonb into ai_output table
     async postAIOutputForSubmission(submission_id: number, generated_questions: string) {
        try {
            await sql`INSERT INTO ai_output (submission_id, generated_questions, generation_date)
                                    VALUES (${submission_id}, ${JSON.parse(generated_questions)}, CURRENT_TIMESTAMP);`;//TRIM might be weird here idk 
            return true;
        }
        catch (error) {
            throw error;
        }
    }

    // get AI Gen Questions based on submission id.
     async getQuestions(submission_id: number) {
        try {
            const result = await sql`SELECT * FROM ai_output WHERE submission_id = ${submission_id} ORDER BY generation_date DESC;`;
            return result.length ? result : null;
        }
        catch (error) {
            throw error;
        }
    }

    // get exams
     async getExams(submission_id: number) {
        try {
            const result = await sql`SELECT * FROM exams WHERE submission_id = ${submission_id};`;
            return result.length ? result : null;
        }
        catch (error) {
            throw error;
        }
    }

    // post exams
     async createExams(user_id: number, submission_id: number, student_id: number) {
        try {
            const users = user_id;
            await sql`INSERT INTO exams (submission_id, student_id, examiner_id) VALUES
                                        (${submission_id}, ${student_id}, ${users});`;
            return true;
        }
        catch (error) {
            throw error;
        }
    }

     async addStudent(email: string, student_id: number, first_name: string, last_name: string) {
        try {
            await sql`INSERT INTO students (student_id, first_name, last_name, email) VALUES
                                        (${student_id},TRIM(both '"' from ${first_name}), TRIM(both '"' from ${last_name}), TRIM(both '"' from ${email}));`;
            return true;
        }
        catch (error) {
            throw error;
        }
    }

     async getAllStudents() {//placeholder for the students get endpoint
        try{
            const students = await sql`SELECT * FROM students`;
            return students;
        }
        catch(error){
            throw error;
        }
    }

    // get students based on class.
     async getStudentsByClass(user_id: number, specificClass: number) {
        try {
            const users = user_id;
            if (users) {
                const verifyUser = await sql`SELECT author_id FROM class WHERE class_id = ${specificClass};`;
                if (verifyUser[0]['author_id'] === users){	//verifying that the user is the one that owns this class
                    // Get class by class_id
                    const classes = await sql`SELECT * FROM class WHERE class_id = ${specificClass};`;
                    if (classes.length === 0) {
                        throw new Error('Class not found');
                    }
                    const studentIds = classes[0]['students'];
                    if (studentIds && studentIds.length > 0) {
                        // Get students based on the class 'students' list
                        const students = await sql`SELECT * FROM students WHERE student_id IN (${sql(studentIds)});`;
                        return students;
                    } else {
                        throw new Error('No students found');
                    }
                }
                else {
                    throw new Error('User not permitted to get this list');
                }            
            }
            else {
                throw new Error('User not found');
            }
        }
        catch (error) {
            throw error;
        }
    }

    async addStudentToClass(user_id: number, student_id: number, specificClass: number){
        try{
            //add verifications
            const studentBuffer: ArrayBuffer = new ArrayBuffer(student_id);
            await sql`UPDATE class SET students = students || ${student_id} WHERE class_id = ${specificClass};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

    async removeStudentFromClass(user_id: number, student_id: number, specificClass: number){
        try{
            //add verifications
            await sql`UPDATE class SET students = array_remove(students, ${student_id}) WHERE class_id = ${specificClass};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

    //DELETE FUNCTIONS

     async deleteStudent(student_id: number) {
        try{
            //may add a check that the student exists because currently returns true even if the thing doesnt exist
            await sql`DELETE FROM students WHERE student_id = ${student_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

     async deleteSubmission(user_id: number, submission_id: number) {
        try{
            //may add a check that the submission exists
            //may add a check that the author is the one sending the request
            await sql`DELETE FROM submissions WHERE submission_id = ${submission_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

     async deleteClass(user_id: number, class_id: number) {
        try{
            //may add a check that the class exists
            //may add a check that the author is the one sending the request
            await sql`DELETE FROM class WHERE class_id = ${class_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

     async deleteAssignment(user_id: number, assignment_id: number) {
        try{
            //may add a check that the assignment exists
            //may add a check that the author is the one sending the request
            await sql`DELETE FROM assignments WHERE assignment_id = ${assignment_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

     async deleteExam(user_id: number, exam_id: number) {
        try{
            //may add a check that the exam exists
            //may add a check that the author is the one sending the request
            await sql`DELETE FROM exams WHERE exam_id = ${exam_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }

    //EDIT FUNCTIONS
     async editStudent(email: string, student_id: number, first_name: string, last_name: string) {
        try{
            //add a check that the student exists
            await sql`UPDATE students SET first_name = TRIM(both '"' from ${first_name}), last_name = TRIM(both '"' from ${last_name}), email = TRIM(both '"' from ${email}) WHERE student_id = ${student_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }
     async editSubmission(user_id: number, submission_id: number, assignment_id: number, student_id: number, submission_date: string, submission_filepath: string) {
        try{
            //add a check that the submission exists
            //add a check that the author is the one sending the request 
            await sql`UPDATE submissions SET student_id = ${student_id}, assignment_id = ${assignment_id}, submission_date = NOW(), submission_filepath = TRIM(both '"' from ${submission_filepath}) WHERE submission_id = ${submission_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }
     async editClass(user_id: number, class_id: number, session: number, year: number, code: string, title: string) {
        try{
            //add a check that the author is the one sending the request 
            //add a check that the class exists
            await sql`UPDATE class SET session = ${session}, year = ${year}, code = TRIM(both '"' from ${code}), title = TRIM(both '"' from ${title}) WHERE class_id = ${class_id};`;// more fields added post MVP
            return true;
        }
        catch(error){
            throw error;
        }
    }
     async editAssignment(user_id: number, assignment_id: number, class_id: number, name: string, description: string) {
        try{
            //add a check that the author is the one sending the request 
            //add a check that the submission exists
            await sql`UPDATE assignments SET class_id = ${class_id}, name = TRIM(both '"' from ${name}), description = TRIM(both '"' from ${description}) WHERE assignment_id = ${assignment_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }
     async editExam(user_id: number, exam_id: number, submission_id: number, student_id: number, examiner_id: number, marks: number, comments: string) {
        try{
            //add a check that the author is the one sending the request 
            //add a check that the submission exists
            await sql`UPDATE assignments SET submission_id = ${submission_id}, student_id = ${student_id}, marks = ${marks}, comments = TRIM(both '"' from ${comments}, examiner_id = ${examiner_id}) WHERE exam_id = ${exam_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }
    //NAME GETTERS
     async getNameOfClass(user_id: number, classID: number){
        try{
            const users = user_id;
            if (users) {
                const temp = await sql`SELECT code FROM class WHERE class_id = ${classID} AND author_id = ${users}`;
                return temp[0]['code'];
            }
            else{
                throw new Error('User does not posess such a class');
            }
        }
        catch(error){
            throw error;
        }
    }
}




