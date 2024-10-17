"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIDbyEmail = getUserIDbyEmail;
exports.getEmailbyUserID = getEmailbyUserID;
exports.loginUserCheck = loginUserCheck;
exports.getHashedPasswordFromDatabase = getHashedPasswordFromDatabase;
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
exports.getAllStudents = getAllStudents;
exports.getStudentsByClass = getStudentsByClass;
exports.deleteStudent = deleteStudent;
exports.deleteSubmission = deleteSubmission;
exports.deleteClass = deleteClass;
exports.deleteAssignment = deleteAssignment;
exports.deleteExam = deleteExam;
exports.editStudent = editStudent;
exports.editSubmission = editSubmission;
exports.editClass = editClass;
exports.editAssignment = editAssignment;
exports.editExam = editExam;
exports.getNameOfClass = getNameOfClass;
const postgres_1 = __importDefault(require("postgres"));
require("dotenv/config");
const sql = (0, postgres_1.default)(`postgres://${process.env.DB_USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(process.env.PORT, 10)}/${process.env.DB}`);
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
// Convert email to user_id. Returns string if found, null otherwise.
async function getEmailbyUserID(user_id) {
    try {
        const users = await sql `SELECT * FROM users WHERE user_id = ${user_id};`;
        return users.length ? users[0]['email'] : null;
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
//get hashed password for a user
async function getHashedPasswordFromDatabase(email) {
    try {
        const password = await sql `SELECT pass FROM users WHERE email LIKE TRIM(both '"' from ${email});`;
        return password[0]['pass']; //return the password string
    }
    catch (error) {
        throw error;
    }
}
// Add user into users table based on placeholder values and the email parameter.
async function signupUser(email, hashedPassword) {
    try {
        if (await loginUserCheck(email) != true) { //if name isnt already present
            await sql `INSERT INTO users (username, first_name, last_name, email, pass, is_admin) VALUES ('placeholder', 'John', 'Appleseed', TRIM(both '"' from ${email}), ${hashedPassword}, false)`;
            return true;
        }
        else {
            console.log(`email: ${email} already in use`);
            throw new Error(`Email already in use`);
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
async function signup(email, hashedPassword) {
    try {
        if (!await getUser(email)) {
            return await signupUser(email, hashedPassword);
        }
        return false;
    }
    catch (error) {
        throw error;
    }
}
// get classes by user from email.
async function getClasses(user_id) {
    try {
        const users = user_id;
        if (users) {
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
async function createClass(user_id, session, year, title, code) {
    try {
        const users = user_id;
        //we should probably add some sort of class already exists protection in future
        if (users) {
            await sql `INSERT INTO class (author_id, session, year, title, code, creation_date) VALUES
                                        (${users}, ${session}, ${year}, TRIM(both '"' from ${title}), TRIM(both '"' from ${code}), NOW());`; //the TRIM bit is because this has "" on it because typescript/javascript
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
async function getAssignments(user_id, specificClass) {
    try {
        const users = user_id;
        if (users) {
            const verifyUser = await sql `SELECT author_id FROM class WHERE class_id = ${specificClass};`;
            if (verifyUser[0]['author_id'] === users) {
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
async function createAssignment(user_id, class_id, name, description) {
    try {
        const users = user_id;
        await sql `INSERT INTO assignments (class_id, name, description) VALUES (${class_id}, TRIM(both '"' from ${name}), TRIM(both '"' from ${description}));`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
// get viva based on submissions JOIN viva_output
// TO DO
async function getVivaForSubmission(user_id, specificSubmission, specificGenQ) {
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
async function getSubmissionFilePathForSubID(specificSubmission) {
    try {
        const submission = await sql `SELECT * FROM submissions WHERE submission_id = ${specificSubmission};`;
        const sPath = submission[0]['submission_filepath'];
        return sPath;
    }
    catch (error) {
        throw error;
    }
}
// get submissions with user, class, and assignment
async function getSubmissionsForAssignments(user_id, specificClass, specificAssignment) {
    try {
        const users = user_id;
        if (users) {
            const verifyUser = await sql `SELECT author_id FROM class WHERE class_id = ${specificClass};`;
            if (verifyUser[0]['author_id'] === users) { //verifying that the user is the one that owns this class			
                const verifyClass = await sql `SELECT class_id FROM assignments WHERE assignment_id = ${specificAssignment};`;
                if (verifyClass[0]['class_id'] === specificClass) { //if the class we have verified the user has control over is the same as the one that corresponds to the assignments
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
async function createSubmission(user_id, assignment_id, student_id, submission_date, submission_filepath) {
    try {
        const users = user_id; //not used, but will be used for verification
        await sql `INSERT INTO submissions (assignment_id, student_id, submission_date, submission_filepath) VALUES
                                    (${assignment_id}, ${student_id}, NOW(), TRIM(both '"' from ${submission_filepath}));`; //for NOW() to work correctly we need to do SET TIMEZONE with aus but leaving until later for now
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
                                VALUES (${submission_id}, ${JSON.parse(generated_questions)}, CURRENT_TIMESTAMP);`; //TRIM might be weird here idk 
        return true;
    }
    catch (error) {
        throw error;
    }
}
// get AI Gen Questions based on submission id.
async function getQuestions(submission_id) {
    try {
        const result = await sql `SELECT * FROM ai_output WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}
// get exams
async function getExams(submission_id) {
    try {
        const result = await sql `SELECT * FROM exams WHERE submission_id = ${submission_id};`;
        return result.length ? result : null;
    }
    catch (error) {
        throw error;
    }
}
// post exams
async function createExams(user_id, submission_id, student_id) {
    try {
        const users = user_id;
        await sql `INSERT INTO exams (submission_id, student_id, examiner_id) VALUES
                                    (${submission_id}, ${student_id}, ${users});`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function addStudent(email, student_id, first_name, last_name) {
    try {
        await sql `INSERT INTO students (student_id, first_name, last_name, email) VALUES
                                    (${student_id},TRIM(both '"' from ${first_name}), TRIM(both '"' from ${last_name}), TRIM(both '"' from ${email}));`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function getAllStudents() {
    try {
        const students = await sql `SELECT * FROM students`;
        return students;
    }
    catch (error) {
        throw error;
    }
}
// get students based on class.
async function getStudentsByClass(user_id, specificClass) {
    try {
        const users = user_id;
        if (users) {
            const verifyUser = await sql `SELECT author_id FROM class WHERE class_id = ${specificClass};`;
            if (verifyUser[0]['author_id'] === users) { //verifying that the user is the one that owns this class
                // Get class by class_id
                const classes = await sql `SELECT * FROM class WHERE class_id = ${specificClass};`;
                if (classes.length === 0) {
                    throw new Error('Class not found');
                }
                const studentIds = classes[0]['students'];
                if (studentIds && studentIds.length > 0) {
                    // Get students based on the class 'students' list
                    const students = await sql `SELECT * FROM students WHERE student_id IN (${sql(studentIds)});`;
                    return students;
                }
                else {
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
//DELETE FUNCTIONS
async function deleteStudent(student_id) {
    try {
        //may add a check that the student exists because currently returns true even if the thing doesnt exist
        await sql `DELETE FROM students WHERE student_id = ${student_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function deleteSubmission(user_id, submission_id) {
    try {
        //may add a check that the submission exists
        //may add a check that the author is the one sending the request
        await sql `DELETE FROM submissions WHERE submission_id = ${submission_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function deleteClass(user_id, class_id) {
    try {
        //may add a check that the class exists
        //may add a check that the author is the one sending the request
        await sql `DELETE FROM class WHERE class_id = ${class_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function deleteAssignment(user_id, assignment_id) {
    try {
        //may add a check that the assignment exists
        //may add a check that the author is the one sending the request
        await sql `DELETE FROM assignments WHERE assignment_id = ${assignment_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function deleteExam(user_id, exam_id) {
    try {
        //may add a check that the exam exists
        //may add a check that the author is the one sending the request
        await sql `DELETE FROM exams WHERE exam_id = ${exam_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
//EDIT FUNCTIONS
async function editStudent(email, student_id, first_name, last_name) {
    try {
        //add a check that the student exists
        await sql `UPDATE students SET first_name = TRIM(both '"' from ${first_name}), last_name = TRIM(both '"' from ${last_name}), email = TRIM(both '"' from ${email}) WHERE student_id = ${student_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function editSubmission(user_id, submission_id, assignment_id, student_id, submission_date, submission_filepath) {
    try {
        //add a check that the submission exists
        //add a check that the author is the one sending the request 
        await sql `UPDATE submissions SET student_id = ${student_id}, assignment_id = ${assignment_id}, submission_date = NOW(), submission_filepath = TRIM(both '"' from ${submission_filepath}) WHERE submission_id = ${submission_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function editClass(user_id, class_id, session, year, code, title) {
    try {
        //add a check that the author is the one sending the request 
        //add a check that the class exists
        await sql `UPDATE class SET session = ${session}, year = ${year}, code = TRIM(both '"' from ${code}), title = TRIM(both '"' from ${title}) WHERE class_id = ${class_id};`; // more fields added post MVP
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function editAssignment(user_id, assignment_id, class_id, name, description) {
    try {
        //add a check that the author is the one sending the request 
        //add a check that the submission exists
        await sql `UPDATE assignments SET class_id = ${class_id}, name = TRIM(both '"' from ${name}), description = TRIM(both '"' from ${description}) WHERE assignment_id = ${assignment_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
async function editExam(user_id, exam_id, submission_id, student_id, examiner_id, marks, comments) {
    try {
        //add a check that the author is the one sending the request 
        //add a check that the submission exists
        await sql `UPDATE assignments SET submission_id = ${submission_id}, student_id = ${student_id}, marks = ${marks}, comments = TRIM(both '"' from ${comments}, examiner_id = ${examiner_id}) WHERE exam_id = ${exam_id};`;
        return true;
    }
    catch (error) {
        throw error;
    }
}
//NAME GETTERS
async function getNameOfClass(user_id, classID) {
    try {
        const users = user_id;
        if (users) {
            const temp = await sql `SELECT code FROM class WHERE class_id = ${classID} AND author_id = ${users}`;
            return temp[0]['code'];
        }
        else {
            throw new Error('User does not posess such a class');
        }
    }
    catch (error) {
        throw error;
    }
}
