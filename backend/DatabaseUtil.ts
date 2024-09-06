import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(`postgres://${process.env.USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(<string>process.env.PORT, 10)}/${process.env.DB}`);

/* --------------------------------------------------------------------------- */

// Convert email to user_id. Returns integer if found, null otherwise.
export async function getUserIDbyEmail(email: string) {
    try {
        const users = await sql`SELECT user_id FROM users WHERE email LIKE ${email};`;
        return users.length ? users[0]['user_id'] : null;
    }
    catch (error) {
        throw error;
    }
}

// Check if user email exists. Return false otherwise.
export async function loginUserCheck(email: string) {
    try {
        const users = await sql`SELECT * FROM users WHERE email LIKE ${email};`;
        return users.length ? true : false;
    }
    catch (error) {
        throw error;
    }
}

// Add user into users table based on placeholder values and the email parameter.
export async function signupUser(email: string) {
    try {
        await sql`INSERT INTO users (username, first_name, last_name, email, is_admin) VALUES ('placeholder', 'John', 'Appleseed', ${email}, false)`;
        return true;
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
            throw new Error('User not found');
        }
    }
    catch (error) {
        throw error;
    }
}

// post classes by user from email. Input: email, class code
export async function createClass(email: string, code: string) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql`INSERT INTO assignments (author_id, code) VALUES
                                    (${users}, ${code});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}

// get assignments based on class.
export async function getAssignments(email: string, specificClass: string) {
    try {
        const users = await getUserIDbyEmail(email);
		if (users) {
			const verifyUser = await sql`SELECT author_id FROM class WHERE class = ${specificClass};`;
			if (verifyUser[0]['author_id'] === users['user_id']) {const results = await sql`SELECT * FROM assignments WHERE class_id = ${specificClass};`;
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
        await sql`INSERT INTO assignments (class_id, name, description) VALUES
                                    (${class_id}, ${name}, ${description});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}

// get viva based on submissions JOIN viva_output
// TO DO
export async function getVivaForSubmission(email: string, specificSubmission: string, specificGenQ: string){
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
export async function getSubmissionFilePathForSubID(specificSubmission: string){
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
export async function getSubmissionsForAssignments(email: string, specificClass: string, specificAssignment: string){
    try {
        const users = await getUserIDbyEmail(email);
		if (users) {
			const verifyUser = await sql`SELECT author_id FROM class WHERE class = ${specificClass};`;
			if (verifyUser[0]['author_id'] === users['user_id']) {				
				const verifyClass = await sql`SELECT class_id FROM assignments WHERE assignments = ${specificAssignment};`
				if (verifyClass[0]['class_id'] === verifyUser[0]['class_id']) {
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
export async function createSubmission(email: string, assignment_id: number, student_id: number, submission_date: Date, submission_filepath: string) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql`INSERT INTO submissions (assignment_id, student_id, submission_date, submission_filepath) VALUES
                                    (${assignment_id}, ${student_id}, ${submission_date}, ${submission_filepath});`;
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
                                VALUES (${submission_id}, '${JSON.parse(generated_questions)}', CURRENT_TIMESTAMP);`;
        return true;
    }
    catch (error) {
        throw error;
    }
}

// get AI Gen Questions based on submission id.
export async function getQuestions(submission_id: number) {
    try {
        const result = await sql`SELECT generated_questions, generation_date FROM ai_output WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}

// get exams
export async function getExams(submission_id: number) {
    try {
        const result = await sql`SELECT * FROM exam_id WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}

// post exams
export async function createExams(submission_id: number, student_id: number, email: string) {
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

export async function addStudent(student_id: number, first_name: string, last_name: string, email: string) {
    try {
        await sql`INSERT INTO students (student_id, first_name, last_name, email) VALUES
                                    (${student_id}, ${first_name}, ${last_name}, ${email});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}






