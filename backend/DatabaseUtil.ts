import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(`postgres://${process.env.USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(<string>process.env.PORT, 10)}/${process.env.DB}`);

/* --------------------------------------------------------------------------- */

// Convert email to user_id. Returns integer if found, null otherwise.
export async function getUserIDbyEmail(email: string){
    try {
        const users = await sql`SELECT user_id FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
        return users.length ? users[0]['user_id'] : null;
    }
    catch (error) {
        throw error;
    }
}

// Check if user email exists. Return false otherwise.
export async function loginUserCheck(email: string) {
    try {
        const users = await sql`SELECT * FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
        return users.length ? true : false;
    }
    catch (error) {
        throw error;
    }
}

// Add user into users table based on placeholder values and the email parameter.
export async function signupUser(email: string) {
    try {
        if(await loginUserCheck(email) != true){//if name isnt already present
            await sql`INSERT INTO users (username, first_name, last_name, email, is_admin) VALUES ('placeholder', 'John', 'Appleseed', TRIM(both '"' from ${email}), false)`;
            return true;
        }
        else{
            console.log('email: ' + email + ' already in use');
            return false;
        }
    }
    catch (error) {
        throw error;
    }
}

// Login User via GET request
export async function getUser(email: string) {
    try {
        return loginUserCheck(email);
    }
    catch (error) {
        throw error
    }
}

// Signup User via POST request with email
export async function signup(email: string) {
    try {
        if (!await getUser(email)) {
            return await signupUser(email);
        }
        return false;
    }
    catch (error) {
        throw error
    }
}

// get classes by user from email.
export async function getClasses(email: string) {
    try {
        const users = await getUserIDbyEmail(email);
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
export async function createClass(email: string, session: number, year: number, title: string, code: string) {
    try {
        const users = await getUserIDbyEmail(email);
        //we should probably add some sort of class already exists protection in future
        if (users)
        {
            await sql`INSERT INTO class (author_id, session, year, title, code, creation_date) VALUES
                                        (${users}, ${session}, ${year}, TRIM(both '"' from ${title}), TRIM(both '"' from ${code}), NOW());`;//the TRIM bit is because this has "" on it because typescript/javascript
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
export async function getAssignments(email: string, specificClass: number) {
    try {
        const users = await getUserIDbyEmail(email);
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
export async function createAssignment(email: string, class_id: number, name: string, description: string) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql`INSERT INTO assignments (class_id, name, description) VALUES (${class_id}, TRIM(both '"' from ${name}), TRIM(both '"' from ${description}));`;
        return true;
    }
    catch (error) {
        throw error;
    }
}

// get viva based on submissions JOIN viva_output
// TO DO
export async function getVivaForSubmission(email: string, specificSubmission: number, specificGenQ: number){
    try {
        const users = await getUserIDbyEmail(email);
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
export async function getSubmissionFilePathForSubID(specificSubmission: number){
    try {
        const submission = await sql`SELECT * FROM submissions WHERE submission_id = ${specificSubmission};`;
		const sPath = submission[0].submission_filepath;
        return sPath;
    }
    catch (error) {
        throw error;
    }
}

// get submissions with user, class, and assignment
export async function getSubmissionsForAssignments(email: string, specificClass: number, specificAssignment: number){
    try {
        const users = await getUserIDbyEmail(email);
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
export async function createSubmission(email: string, assignment_id: number, student_id: number, submission_date: string, submission_filepath: string) {
    try {
        const users = await getUserIDbyEmail(email);//not used?
        await sql`INSERT INTO submissions (assignment_id, student_id, submission_date, submission_filepath) VALUES
                                    (${assignment_id}, ${student_id}, NOW(), TRIM(both '"' from ${submission_filepath}));`;//for NOW() to work correctly we need to do SET TIMEZONE with aus but leaving until later for now
        return true;
    }
    catch (error) {
        throw error;
    }
}

// internal query to export PDF file filepath
export async function getPDFFile(student_id: number, assignment_id: number) {
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
export async function postAIOutputForSubmission(submission_id: number, generated_questions: string) {
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
export async function getQuestions(submission_id: number) {
    try {
        const result = await sql`SELECT * FROM ai_output WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}

// get exams
export async function getExams(submission_id: number) {
    try {
        const result = await sql`SELECT * FROM exams WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}

// post exams
export async function createExams(email: string, submission_id: number, student_id: number) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql`INSERT INTO exams (submission_id, student_id, examiner_id) VALUES
                                    (${submission_id}, ${student_id}, ${users});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}

export async function addStudent(email: string, student_id: number, first_name: string, last_name: string) {
    try {
        await sql`INSERT INTO students (student_id, first_name, last_name, email) VALUES
                                    (${student_id},TRIM(both '"' from ${first_name}), TRIM(both '"' from ${last_name}), TRIM(both '"' from ${email}));`;
        return true;
    }
    catch (error) {
        throw error;
    }
}

export async function getAllStudents() {//placeholder for the students get endpoint
    try{
        const students = await sql`SELECT * FROM students`;
        return students;
    }
    catch(error){
        throw error;
    }
}
//DELETE FUNCTIONS

export async function deleteStudent(student_id: number) {
    try{
        //may add a check that the student exists because currently returns true even if the thing doesnt exist
        await sql`DELETE FROM students WHERE student_id = ${student_id};`;
        return true;
    }
    catch(error){
        throw error;
    }
}

export async function deleteSubmission(email: string, submission_id: number) {
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

export async function deleteClass(email: string, class_id: number) {
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

export async function deleteAssignment(email: string, assignment_id: number) {
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

export async function deleteExam(email: string, exam_id: number) {
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
export async function editStudent(email: string, student_id: number, first_name: string, last_name: string) {
    try{
        //add a check that the student exists
        await sql`UPDATE students SET first_name = TRIM(both '"' from ${first_name}), last_name = TRIM(both '"' from ${last_name}), email = TRIM(both '"' from ${email}) WHERE student_id = ${student_id};`;
        return true;
    }
    catch(error){
        throw error;
    }
}
export async function editSubmission(email: string, submission_id: number, assignment_id: number, student_id: number, submission_date: string, submission_filepath: string) {
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
export async function editClass(email: string, class_id: number, session: number, year: number, code: string, title: string) {
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
export async function editAssignment(email: string, assignment_id: number, class_id: number, name: string, description: string) {
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
export async function editExam(email: string, exam_id: number, submission_id: number, student_id: number, examiner_id: number, marks: number, comments: string) {
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



