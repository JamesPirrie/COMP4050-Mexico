import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(`postgres://${process.env.USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(<string>process.env.PORT, 10)}/${process.env.DB}`);

/* --------------------------------------------------------------------------- */

// Convert email to user_id. Returns integer if found, null otherwise.
async function getUserIDbyEmail(email: string) {
    try {
        const users = await sql`SELECT user_id FROM users WHERE email LIKE ${email};`;
        return users.length ? users[0]['user_id'] : null;
    }
    catch (error) {
        throw error;
    }
}

// Check if user email exists. Return false otherwise.
async function loginUserCheck(email: string) {
    try {
        const users = await sql`SELECT * FROM users WHERE email LIKE ${email};`;
        return users.length ? true : false;
    }
    catch (error) {
        throw error;
    }
}

// Add user into users table based on placeholder values and the email parameter.
async function signupUser(email: string) {
    try {
        console.log('awoo');
        //await sql`INSERT INTO users (username, first_name, last_name, email, is_admin) VALUES ('placeholder', 'John', 'Appleseed', ${email}, false)`;
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
// TODO

// get assignments based on class.

// post assignments based on class.

// get viva based on submissions JOIN viva_output

// post submissions with document, class, placeholder student

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

// get viva outputs based on submission id.
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
export async function createExams(submission_id: number, student_id: number, user_id: number) {
    try {
        await sql`INSERT INTO exams (submission_id, student_id, examiner_id) VALUES
                                    (${submission_id}, ${student_id}, ${user_id});`;
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






