import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const sql = postgres(`postgres://${process.env.USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(<string>process.env.PORT, 10)}/${process.env.DB}`);

/* --------------------------------------------------------------------------- */

// Convert email to user_id. Returns null if no user is found.
async function getUserIDbyEmail(email: string) {
    try {
        const users = await sql`SELECT user_id FROM users WHERE email LIKE ${email};`;
        return users.length ? users[0]['user_id'] : null;
    }
    catch (error) {
        console.log('Error: ', error);
    }
}

// Check if user email exists. Return false otherwise.
async function loginUserCheck(email: string) {
    try {
        const users = await sql`SELECT * FROM users WHERE email LIKE ${email};`;
        return users.length ? true : false;
    }
    catch (error) {
        console.log('Error: ', error);
    }
}

// Add user into users table based on placeholder values and the email parameter.
async function signupUser(email: string) {
    try {
        await sql`INSERT INTO users (username, first_name, last_name, email, is_admin) VALUES ('placeholder', 'John', 'Appleseed', ${email}, false)`;
        return true;
    }
    catch (error) {
        console.log('Error: ', error);
    }
}

// Login User via GET request
export async function getUser(email: string) {
    try {
        return loginUserCheck(email);
    }
    catch (error) {
        console.log('Error: ', error)
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
        console.log('Error: ', error)
    }
}

// get classes by user from email.
async function getClasses(email: string) {
    try {
        const users = await getUserIDbyEmail(email);
        if (users != null) {
            const results = await sql`SELECT * FROM class WHERE author_id = ${users};`
            return results;
        }
        else {
            throw new Error('User not found');
        }
    }
    catch (error) {
        console.log('Error: ', error);
    }
}

// post classes by user from email. Input: email, class code
// TODO

// get assignments based on class.

// post assignments based on class.

// get viva based on submissions JOIN viva_output

// post submissions with document, class, placeholder student

// internal query to export PDF file filepath

// internal query to receive generated questions in jsonb into viva_output table






