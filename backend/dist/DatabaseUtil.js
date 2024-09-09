"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIDbyEmail = getUserIDbyEmail;
exports.loginUserCheck = loginUserCheck;
exports.signupUser = signupUser;
exports.getUser = getUser;
exports.signup = signup;
exports.getClasses = getClasses;
exports.createClass = createClass;
exports.getAssignments = getAssignments;
exports.createAssignment = createAssignment;
exports.getVivaForSubmission = getVivaForSubmission;
exports.getSubmissionFilePathForSubID = getSubmissionFilePathForSubID;
exports.getSubmissionsForAssignments = getSubmissionsForAssignments;
exports.createSubmission = createSubmission;
exports.getPDFFile = getPDFFile;
exports.postAIOutputForSubmission = postAIOutputForSubmission;
exports.getQuestions = getQuestions;
exports.getExams = getExams;
exports.createExams = createExams;
exports.addStudent = addStudent;
const postgres_1 = __importDefault(require("postgres"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sql = (0, postgres_1.default)(`postgres://${process.env.USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(process.env.PORT, 10)}/${process.env.DB}`);
/* --------------------------------------------------------------------------- */
// Convert email to user_id. Returns integer if found, null otherwise.
async function getUserIDbyEmail(email) {
    try {
        const users = await sql `SELECT user_id FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
        return users.length ? users[0]['user_id'] : null;
    }
    catch (error) {
        throw error;
    }
}
// Check if user email exists. Return false otherwise.
async function loginUserCheck(email) {
    try {
        const users = await sql `SELECT * FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
        return users.length ? true : false;
    }
    catch (error) {
        throw error;
    }
}
// Add user into users table based on placeholder values and the email parameter.
async function signupUser(email) {
    try {
        if (await loginUserCheck(email) != true) { //if name isnt already present
            await sql `INSERT INTO users (username, first_name, last_name, email, is_admin) VALUES ('placeholder', 'John', 'Appleseed', TRIM(both '"' from ${email}), false)`;
            return true;
        }
        else {
            console.log('email: ' + email + ' already in use');
            return false;
        }
    }
    catch (error) {
        throw error;
    }
}
// Login User via GET request
async function getUser(email) {
    try {
        return loginUserCheck(email);
    }
    catch (error) {
        throw error;
    }
}
// Signup User via POST request with email
async function signup(email) {
    try {
        if (!await getUser(email)) {
            return await signupUser(email);
        }
        return false;
    }
    catch (error) {
        throw error;
    }
}
// get classes by user from email.
async function getClasses(email) {
    try {
        const users = await getUserIDbyEmail(email);
        if (users != null) {
            const results = await sql `SELECT * FROM class WHERE author_id = ${users};`;
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
async function createClass(email, code) {
    try {
        const users = await getUserIDbyEmail(email);
        //we should probably ass some sort of class already exists protection in future
        await sql `INSERT INTO class (author_id, code) VALUES
                                    (${users}, TRIM(both '"' from ${code}));`; //the TRIM bit is because this has "" on it because typescript/javascript
        return true;
    }
    catch (error) {
        //throw error;
        return false;
    }
}
// get assignments based on class.
async function getAssignments(email, specificClass) {
    try {
        const users = await getUserIDbyEmail(email);
        if (users) {
            const verifyUser = await sql `SELECT author_id FROM class WHERE class = ${specificClass};`;
            if (verifyUser[0]['author_id'] === users['user_id']) {
                const results = await sql `SELECT * FROM assignments WHERE class_id = ${specificClass};`;
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
async function createAssignment(email, class_id, name, description) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql `INSERT INTO assignments (class_id, name, description) VALUES
                                    (TRIM(both '"' from ${class_id}), ${name}, ${description});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
// get viva based on submissions JOIN viva_output
// TO DO
async function getVivaForSubmission(email, specificSubmission, specificGenQ) {
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
async function getSubmissionFilePathForSubID(specificSubmission) {
    try {
        const submission = await sql `SELECT * FROM submissions WHERE submission_id = ${specificSubmission};`;
        const sPath = submission[0].submission_filepath;
        return sPath;
    }
    catch (error) {
        throw error;
    }
}
// get submissions with user, class, and assignment
async function getSubmissionsForAssignments(email, specificClass, specificAssignment) {
    try {
        const users = await getUserIDbyEmail(email);
        if (users) {
            const verifyUser = await sql `SELECT author_id FROM class WHERE class = ${specificClass};`;
            if (verifyUser[0]['author_id'] === users['user_id']) {
                const verifyClass = await sql `SELECT class_id FROM assignments WHERE assignments = ${specificAssignment};`;
                if (verifyClass[0]['class_id'] === verifyUser[0]['class_id']) {
                    const results = await sql `SELECT * FROM submissions WHERE assignment_id = ${specificAssignment};`;
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
async function createSubmission(email, assignment_id, student_id, submission_date, submission_filepath) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql `INSERT INTO submissions (assignment_id, student_id, submission_date, submission_filepath) VALUES
                                    (${assignment_id}, ${student_id}, ${submission_date}, ${submission_filepath});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
// internal query to export PDF file filepath
async function getPDFFile(student_id, assignment_id) {
    try {
        const result = await sql `SELECT submission_filepath FROM submissions 
                                    WHERE student_id = ${student_id}
                                    AND assignment_id = ${assignment_id};`;
        return result.length ? result[0]['submission_filepath'] : null;
    }
    catch (error) {
        throw error;
    }
}
// internal query to receive generated questions in jsonb into ai_output table
async function postAIOutputForSubmission(submission_id, generated_questions) {
    try {
        await sql `INSERT INTO ai_output (submission_id, generated_questions, generation_date)
                                VALUES (${submission_id}, '${JSON.parse(generated_questions)}', CURRENT_TIMESTAMP);`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
// get AI Gen Questions based on submission id.
async function getQuestions(submission_id) {
    try {
        const result = await sql `SELECT generated_questions, generation_date FROM ai_output WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}
// get exams
async function getExams(submission_id) {
    try {
        const result = await sql `SELECT * FROM exam_id WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}
// post exams
async function createExams(submission_id, student_id, email) {
    try {
        const users = await getUserIDbyEmail(email);
        await sql `INSERT INTO exams (submission_id, student_id, examiner_id) VALUES
                                    (${submission_id}, ${student_id}, ${users});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function addStudent(student_id, first_name, last_name, email) {
    try {
        await sql `INSERT INTO students (student_id, first_name, last_name, email) VALUES
                                    (${student_id}, ${first_name}, ${last_name}, ${email});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
