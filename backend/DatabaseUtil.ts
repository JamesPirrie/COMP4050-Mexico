import postgres from 'postgres';
import 'dotenv/config';
import fs from 'fs';
import { ROOTDIR } from './BackendServer';

const sql = postgres(`postgres://${process.env.DB_USER}:${process.env.PASS}@${process.env.HOST}:${parseInt(<string>process.env.PORT, 10)}/${process.env.DB}`);

/* --------------------------------------------------------------------------- */
export class dbUtils {
    // Convert email to user_id. Returns integer if found, null otherwise.
     async getUserIDbyEmail(email: string): Promise<number> {
        try {
            const users = await sql`SELECT user_id FROM users WHERE email LIKE ${email};`;
            return users.length ? users[0]['user_id'] : null;
        }
        catch (error) {
            throw error;
        }
    }

    // Convert email to user_id. Returns string if found, null otherwise.
     async getEmailbyUserID(user_id: number): Promise<String> {
        try {
            const users = await sql`SELECT * FROM users WHERE user_id = ${user_id};`;
            return users.length ? users[0]['email'] : undefined;
        }
        catch (error) {
            throw error;
        }
    }

    // Check if user email exists. Return false otherwise.
     async loginUserCheck(email: string): Promise<Boolean> {
        try {
            const users = await sql`SELECT * FROM users WHERE email LIKE ${email};`;
            return users.length ? true : false;
        }
        catch (error) {
            throw error;
        }
    }

     async updateLastLoggedIn(userID: number): Promise<void> {
        try{
            await sql`UPDATE users SET last_login_date = NOW() WHERE user_id = ${userID};`;
        }
        catch(error){
            throw error;
        }
    }

    //get hashed password for a user
     async getHashedPasswordFromDatabase(email: string): Promise<string> {
        try {
            const password = await sql`SELECT pass FROM users WHERE email LIKE ${email};`;
            return password[0]['pass'];//return the password string
        }
        catch (error) {
            throw error;
        }
    }

    // Add user into users table based on placeholder values and the email parameter.
     async signupUser(email: string, hashedPassword: string, user_name: string, first_name: string, last_name: string): Promise<Boolean> {
        try {
            if(await this.loginUserCheck(email) != true){//if name isnt already present
                await sql`INSERT INTO users (username, first_name, last_name, email, pass, is_admin) VALUES (${user_name}, ${first_name}, ${last_name}, ${email}, ${hashedPassword}, false)`;
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
     async getUser(email: string): Promise<Boolean> {
        try {
            return this.loginUserCheck(email);
        }
        catch (error) {
            throw error
        }
    }

    // get classes by user from email.
     async getClasses(user_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined> {
        try {
            const users = user_id;
            if (users) {
                const results = await sql`SELECT * FROM class WHERE author_id = ${users};`
                return results;
            }
            else {
                return undefined;
            }
        }
        catch (error) {
            throw error;
        }
    }

    // post classes by user from email. Input: email, class code
     async createClass(user_id: number, session: number, year: number, title: string, code: string): Promise<Boolean> {
        try {
            const users = user_id;
            //we should probably add some sort of class already exists protection in future
            if (users)
            {
                await sql`INSERT INTO class (author_id, session, year, title, code, creation_date, expiry_date) VALUES
                                            (${users}, ${session}, ${year}, ${title}, ${code}, NOW(), NOW() + '1 year');`;
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
     async getAssignments(user_id: number, specificClass: number): Promise<postgres.RowList<postgres.Row[]> | undefined> {
        try {
            const users = user_id;
            if (users) {
                const verifyUser = await sql`SELECT author_id FROM class WHERE class_id = ${specificClass};`;
                if (verifyUser[0]['author_id'] === users) {
                    const results = await sql`SELECT * FROM assignments WHERE class_id = ${specificClass};`;
                    return results.length ? results : undefined;
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
     async createAssignment(user_id: number, class_id: number, name: string, description: string): Promise<Boolean> {
        try {
            const users = user_id;
            await sql`INSERT INTO assignments (class_id, name, description) VALUES (${class_id}, ${name}, ${description});`;
            return true;
        }
        catch (error) {
            throw error;
        }
    }

    // get specific submissions with submission_id
     async getSubmissionFilePathForSubID(specificSubmission: number): Promise<string>{
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
     async getSubmissionsForAssignments(user_id: number, specificClass: number, specificAssignment: number): Promise<postgres.RowList<postgres.Row[]> | undefined>{
        try {
            const users = user_id;
            if (users) {
                const verifyUser = await sql`SELECT author_id FROM class WHERE class_id = ${specificClass};`;
                if (verifyUser[0]['author_id'] === users) {	//verifying that the user is the one that owns this class			
                    const verifyClass = await sql`SELECT class_id FROM assignments WHERE assignment_id = ${specificAssignment};`
                    if (verifyClass[0]['class_id'] === specificClass) {//if the class we have verified the user has control over is the same as the one that corresponds to the assignments
                        const results = await sql`SELECT * FROM submissions WHERE assignment_id = ${specificAssignment};`;
                        return results.length ? results : undefined;
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
     async createSubmission(user_id: number, assignment_id: number, student_id: number, submission_filepath: string): Promise<Boolean> {
        try {
            const users = user_id;//not used, but will be used for verification
            await sql`INSERT INTO submissions (assignment_id, student_id, submission_date, submission_filepath) VALUES
                                        (${assignment_id}, ${student_id}, NOW(), ${submission_filepath});`;//for NOW() to work correctly we need to do SET TIMEZONE with aus but leaving until later for now
            return true;
        }
        catch (error) {
            throw error;
        }
    }

    // internal query to  PDF file filepath
     async getPDFFile(student_id: number, assignment_id: number): Promise<string | undefined> {
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
     async postAIOutputForSubmission(submission_id: number, generated_questions: string): Promise<Boolean> {
        try {
            await sql`INSERT INTO ai_output (submission_id, generated_questions, generation_date)
                                    VALUES (${submission_id}, ${JSON.parse(generated_questions)}, CURRENT_TIMESTAMP);`;
            return true;
        }
        catch (error) {
            throw error;
        }
    }

    // get AI Gen Questions based on submission id.
     async getQuestions(submission_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined> {
        try {
            const result = await sql`SELECT * FROM ai_output WHERE submission_id = ${submission_id} ORDER BY generation_date DESC;`;
            return result.length ? result : undefined;
        }
        catch (error) {
            throw error;
        }
    }

    // get exams
     async getExams(submission_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined> {
        try {
            const result = await sql`SELECT * FROM exams WHERE submission_id = ${submission_id};`;
            return result.length ? result : undefined;
        }
        catch (error) {
            throw error;
        }
    }

    // post exams
     async createExams(user_id: number, submission_id: number, student_id: number): Promise<Boolean> {
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

     async addStudent(email: string, student_id: number, first_name: string, last_name: string): Promise<Boolean> {
        try {
            await sql`INSERT INTO students (student_id, first_name, last_name, email) VALUES
                                        (${student_id}, ${first_name}, ${last_name}, ${email});`;
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
     async getStudentsByClass(user_id: number, specificClass: number): Promise<postgres.RowList<postgres.Row[]> | undefined> {
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

    // Add student ID to a class array. Then update the student with the class ID in the classes array.
    async addStudentToClass(user_id: number, student_id: number, specificClass: number): Promise<Boolean> {
        try{
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${specificClass};`;
            const verifyStudent = await sql`SELECT * FROM students WHERE student_id = ${student_id};`;
            if(verifyUser[0]['author_id'] == user_id){
                if(verifyStudent.length){//if there is such a student
                    await sql`UPDATE class SET students = array_append(students, ${student_id}) WHERE class_id = ${specificClass};`;
                    await this.updateStudentClass(specificClass);
                    return true;
                }
                else{
                    throw new Error('No such student found')
                }
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }

    // Remove student ID to a class array. Then update the student with the class ID in the classes array.
    async removeStudentFromClass(user_id: number, student_id: number, specificClass: number): Promise<Boolean> {
        try{
            //add verifications
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${specificClass};`;
            const verifyStudent = await sql`SELECT * FROM students WHERE student_id = ${student_id};`;
            if(verifyUser[0]['author_id'] == user_id){
                if(!verifyStudent.length){//if there isnt such a student
                    throw new Error('No such student found')
                }
                await sql`UPDATE class SET students = array_remove(students, ${student_id}) WHERE class_id = ${specificClass};`;
                await this.updateStudentClass(specificClass);
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }

    // Update classes array in students based on (new) students array in class specificClass.
    async updateStudentClass(specificClass: number): Promise<void> {
        try {
            console.log(`class: ${specificClass}`);
            await sql`UPDATE students SET classes = array_remove(classes, ${specificClass});`;//we might need to get rid of duplicates a little annoying
            await sql`WITH to_update AS (SELECT unnest(students) AS student FROM class WHERE class_id = ${specificClass})
                      UPDATE students SET classes = array_append(classes, ${specificClass}) FROM to_update WHERE student_id = student;`;
        }
        catch(error) {
            throw error;
        }
    }

    //DELETE FUNCTIONS

     async deleteStudent(user_id: number, student_id: number): Promise<Boolean> {
        try{     
            const verifyStudent = await sql`SELECT * FROM students WHERE student_id = ${student_id}`;
            if(verifyStudent.length < 1){
                throw new Error('No such Student found');
            }
            //delete all the ai_outputs
            const submissions = await sql`SELECT * FROM submissions WHERE student_id = ${student_id};`;
            for(var i = 0; i < submissions.length; i++){
                await sql`DELETE FROM ai_output where submission_id = ${submissions[i]['submission_id']};`;
                //delete the files
                const filePath: string = await this.getSubmissionFilePathForSubID(submissions[i]['submission_id']);
                if(fs.existsSync(`${ROOTDIR}/ServerStorage/qGen/${filePath}.json`)){//if theres an ai entry file for this submission
                    fs.unlink(`${ROOTDIR}/ServerStorage/qGen/${filePath}.json`, (error) => {//delete it
                        if(error){
                            throw error;
                        }
                        else{
                            console.log(`File: ${filePath}.json Deleted`);
                        }
                    });
                }
                //delete all the submission files
                if(fs.existsSync(`${ROOTDIR}/ServerStorage/PDF_Storage/${filePath}`)){//if theres an ai entry file for this submission
                    fs.unlink(`${ROOTDIR}/ServerStorage/PDF_Storage/${filePath}`, (error) => {//delete the actual submission file
                        if(error){
                            throw error;
                        }
                        else{
                            console.log(`File: ${filePath} Deleted`);
                        }
                    });
                }
            }

            //delete all them from the classes
            const classes = await sql`SELECT * FROM class WHERE ${student_id} = ANY(students);`;
            for(var i = 0; i < classes.length; i++){
                await this.removeStudentFromClass(user_id, student_id, classes[i]['class_id']);
            }

            await sql`DELETE FROM students WHERE student_id = ${student_id};`;//this will just delete different users items built on that user but the whole system needs a rework to solve
            await sql`DELETE FROM submissions WHERE student_id = ${student_id};`;
            await sql`DELETE FROM exams WHERE student_id = ${student_id};`;

            return true;
        }
        catch(error){
            throw error;
        }
    }

     async deleteSubmission(user_id: number, submission_id: number): Promise<Boolean> {
        try{
            const verifySubmission = await sql`SELECT * FROM submissions WHERE submission_id = ${submission_id}`;
            if(verifySubmission.length < 1){
                throw new Error('No such Submission found');
            }
            const AssignmentID = verifySubmission[0]['assignment_id'];
            const verifyAssignment = await sql`SELECT * FROM assignments WHERE assignment_id = ${AssignmentID}`;
            const ClassID = verifyAssignment[0]['class_id'];
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${ClassID}`;
            if(verifyUser[0]['author_id'] === user_id){
                const filePath: string = await this.getSubmissionFilePathForSubID(submission_id);
                if(fs.existsSync(`${ROOTDIR}/ServerStorage/qGen/${filePath}.json`)){//if theres an ai entry file for this submission
                    fs.unlink(`${ROOTDIR}/ServerStorage/qGen/${filePath}.json`, (error) => {//delete it
                        if(error){
                            throw error;
                        }
                        else{
                            console.log(`File: ${filePath}.json Deleted`);
                        }
                    });
                }

                if(fs.existsSync(`${ROOTDIR}/ServerStorage/PDF_Storage/${filePath}`)){//if theres an ai entry file for this submission
                    fs.unlink(`${ROOTDIR}/ServerStorage/PDF_Storage/${filePath}`, (error) => {//delete the actual submission file
                        if(error){
                            throw error;
                        }
                        else{
                            console.log(`File: ${filePath} Deleted`);
                        }
                    });
                }
                await sql`DELETE FROM submissions WHERE submission_id = ${submission_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }

     async deleteClass(user_id: number, class_id: number): Promise<Boolean> {
        try{
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${class_id}`;
            if(verifyUser.length < 1){
                throw new Error('No such class found');
            }
            if(verifyUser[0]['author_id'] === user_id){
                await sql`DELETE FROM class WHERE class_id = ${class_id};`;
                return true;
            }
            return false;

        }
        catch(error){
            throw error;
        }
    }

     async deleteAssignment(user_id: number, assignment_id: number): Promise<Boolean> {
        try{
            const verifyAssignment = await sql`SELECT * FROM assignments WHERE assignment_id = ${assignment_id};`;
            if(verifyAssignment.length < 1){
                throw new Error('No such assignment found');
            }
            const ClassID = verifyAssignment[0]['class_id']; 
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${ClassID}`;
            if(verifyUser[0]['author_id'] === user_id){
                await sql`DELETE FROM assignments WHERE assignment_id = ${assignment_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }

     async deleteExam(user_id: number, exam_id: number): Promise<Boolean> {
        try{
            const verifyExam = await sql`SELECT * FROM exams WHERE exam_id = ${exam_id}`;
            if(verifyExam.length < 1){
                throw new Error('No such Exam found');
            }
            const SubmissionID = verifyExam[0]['submission_id'];
            const verifyAssignment = await sql`SELECT * FROM submissions WHERE submission_id = ${SubmissionID}`;
            const AssignmentID = verifyAssignment[0]['assignment_id'];
            const verifyClass = await sql`SELECT * FROM assignments WHERE assignment_id = ${AssignmentID}`;
            const ClassID = verifyClass[0]['class_id'];
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${ClassID}`;
            if(verifyUser[0]['author_id'] === user_id){
                await sql`DELETE FROM exams WHERE exam_id = ${exam_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }

    //EDIT FUNCTIONS
     async editStudent(email: string, student_id: number, first_name: string, last_name: string): Promise<Boolean> {
        try{
            const verifyStudent = await sql`SELECT * FROM students WHERE student_id = ${student_id}`;
            if(verifyStudent.length < 1){
                throw new Error('No such Student found');
            }
            await sql`UPDATE students SET first_name = ${first_name}, last_name = ${last_name}, email = ${email} WHERE student_id = ${student_id};`;
            return true;
        }
        catch(error){
            throw error;
        }
    }
     async editSubmission(user_id: number, submission_id: number, assignment_id: number, student_id: number, submission_date: string, submission_filepath: string): Promise<Boolean> {
        try{
            const verifySubmission = await sql`SELECT * FROM submissions WHERE submission_id = ${submission_id}`;
            if(verifySubmission.length < 1){
                throw new Error('No such Submission found');
            }
            const AssignmentID = verifySubmission[0]['assignment_id'];
            const verifyAssignment = await sql`SELECT * FROM assignments WHERE assignment_id = ${AssignmentID}`;
            const ClassID = verifyAssignment[0]['class_id'];
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${ClassID}`;
            if(verifyUser[0]['author_id'] === user_id){
                const verifyNewAssignment = await sql`SELECT * FROM assignments WHERE assignment_id = ${assignment_id}`;
                if(verifyNewAssignment.length < 1){
                    throw new Error('Assignment specified to be edited in does not exist');
                }
                await sql`UPDATE submissions SET student_id = ${student_id}, assignment_id = ${assignment_id}, submission_date = NOW(), submission_filepath = ${submission_filepath} WHERE submission_id = ${submission_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }
     async editClass(user_id: number, class_id: number, session: number, year: number, code: string, title: string): Promise<Boolean> {
        try{
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${class_id};`;
            if(verifyUser.length < 1){
                throw new Error('No such class found');
            }
            if(verifyUser[0]['author_id'] === user_id){
                await sql`UPDATE class SET session = ${session}, year = ${year}, code = ${code}, title = ${title} WHERE class_id = ${class_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }
     async editAssignment(user_id: number, assignment_id: number, class_id: number, name: string, description: string, generic_questions: string): Promise<Boolean> {
        try{
            const verifyAssignment = await sql`SELECT * FROM assignments WHERE assignment_id = ${assignment_id};`;
            if(verifyAssignment.length < 1){
                throw new Error('No such assignment found');
            }
            const ClassID = verifyAssignment[0]['class_id']; 
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${ClassID}`;
            if(verifyUser[0]['author_id'] === user_id){
                const verifyNewClass = await sql`SELECT * FROM class WHERE class_id = ${class_id};`;
                if(verifyNewClass.length < 1){
                    throw new Error('Class specified to be edited in does not exist');
                }
                await sql`UPDATE assignments SET class_id = ${class_id}, name = ${name}, description = ${description}, generic_questions = ${generic_questions} WHERE assignment_id = ${assignment_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }
     async editExam(user_id: number, exam_id: number, submission_id: number, student_id: number, examiner_id: number, marks: number, comments: string): Promise<Boolean> {
        try{
            const verifyExam = await sql`SELECT * FROM exams WHERE exam_id = ${exam_id}`;
            if(verifyExam.length < 1){
                throw new Error('No such Exam found');
            }
            const SubmissionID = verifyExam[0]['submission_id'];
            const verifyAssignment = await sql`SELECT * FROM submissions WHERE submission_id = ${SubmissionID}`;
            const AssignmentID = verifyAssignment[0]['assignment_id'];
            const verifyClass = await sql`SELECT * FROM assignments WHERE assignment_id = ${AssignmentID}`;
            const ClassID = verifyClass[0]['class_id'];
            const verifyUser = await sql`SELECT * FROM class WHERE class_id = ${ClassID}`;
            if(verifyUser[0]['author_id'] === user_id){
                const verifyNewSubmission = await sql`SELECT * FROM submissions WHERE submission_id = ${submission_id};`;
                if(verifyNewSubmission.length < 1){
                    throw new Error('submission specified to be edited in does not exist');
                }
                await sql`UPDATE exams SET submission_id = ${submission_id}, student_id = ${student_id}, marks = ${marks}, comments = ${comments}, examiner_id = ${examiner_id} WHERE exam_id = ${exam_id};`;
                return true;
            }
            return false;
        }
        catch(error){
            throw error;
        }
    }
    //NAME GETTERS
     async getNameOfClass(user_id: number, classID: number): Promise<string> {
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


