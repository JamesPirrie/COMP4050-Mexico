# Database Documentation 
This file contains documentation for the database tables and columns. Please note that some columns are unused in the current implementation and are intended to make extensions easier in the future.
`This is the Post-MVP version of this file.`
# Public Schema
## Users
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| user_id | int4 | |
| username | text | |
| pass | text | Stores hashed password. |
| first_name | text | |
| last_name | text | |
| email | text | |
| is_admin | Boolean | |
| last_login_date | timestamptz | |
## Class
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| class_id | int4 | |
| session | int2 | |
| year | int2 | |
| code | varchar(8) | Class code (e.g. COMP4050) |
| title | text | |
| creation_date | timestamptz | |
| expiry_date | timestamptz | |
| author_id | int4 | |
| tutors | integer array | Array of tutor user IDs. |
| students | integer array | Array of student IDs. |
## Assignments
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |
| assignment_id | int4 | |
| class_id | int4 | |
| name | text | |
| description | text | |
| generic_questions | jsonb | Set of questions input by user in a JSON format. |  
## Submissions
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| submission_id | int4 | |
| assignment_id | int4 | |
| student_id | int4 | |
| submission_date | timestamptz | |
| submission_filepath | text | Path to submission in local storage. |
## Students
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| student_id | int4 | Student's MQ ID |
| first_name | text | |
| last_name | text | |
| email | text | MQ student email. |
| classes | integer array | Array of class_id for classes that student is in. |
## Exams
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| exam_id | int4 | |
| submission_id | int4 | |
| student_id | int4 | |
| marks | int2 | |
| comments | text | |
| examiner_id | int4 | User ID of examiner. |
## AI_Output
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| result_id | int4 | |
| submission_id | int4 | |
| generated_questions | jsonb | AI generated questions in JSON format. |
| generation_date | timestamptz | |
| score | int2 | Rating out of 100 of AI generation. |
## Rubric_Output
| Column Name | Column Type | Additional Notes |
| ------------- | ------------- | ------------- |  
| result_id | int4 | |
| assignment_id | int4 | |
| rubric_json | jsonb | Generated rubric stored as JSON. |
| generation_date | timestamptz | |
# Database Utility Functions

It should be noted that all scenarios not mentioned in the utilization of the below functions are handled by throwing errors, and all functions frequently log error details as appropriate. The specifics of error handling and error messages will not be detailed in this document.

## User Functions
`getUserIDbyEmail` | `async getUserIDbyEmail(email: string): Promise<number>`
- Input parameters: email: string
- Output parameters: Promise<number>
- Description: Function takes a given Email and returns the first user_id in the database with that email. If there is no such user, it returns `null`.
- Function is Asynchronous 

`getEmailbyUserID` | `async getEmailbyUserID(user_id: number): Promise<String>`
- Input parameters: user_id: number
- Output parameters: Promise<String>
- Description: Function takes a given database user_id then returns the email field for a user in the database with that user_id. If there is nothing in the user's email field, it returns `undefined`.
- Function is Asynchronous 

`loginUserCheck` | `async loginUserCheck(email: string): Promise<Boolean>`
- Input parameters: email: string
- Output parameters: Promise<Boolean>
- Description: Function takes a given email then checks if any user on the database has that email in their email field. If the email is tied to a user, it returns `true`. Else, it returns `false`.
- Function is Asynchronous 

`updateLastLoggedIn` | `async updateLastLoggedIn(userID: number): Promise<void>`
- Input parameters: userID: number
- Output parameters: Promise<void>
- Description: Function takes a given database user_id then sets the last_login_date field of the user with that user_id to the current time using `Now()`. The Promise<void> function returns nothing.
- Function is Asynchronous 

`getHashedPasswordFromDatabase` | `async getHashedPasswordFromDatabase(email: string): Promise<string>`
- Input parameters: email: string
- Output parameters: Promise<string>
- Description: Function takes a given email then returns the hashed password for the user that has the given email.
- Function is Asynchronous

`signupUser` | `async signupUser(email: string, hashedPassword: string, user_name: string, first_name: string, last_name: string): Promise<Boolean>`
- Input parameters: email: string, hashedPassword: string, user_name: string, first_name: string, last_name: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters, if the email is not used by an existing user, it inserts the parameters into the fields of a new record in the Users table and returns `true`. Else, if the email is used by an existing user, it returns `false`.
- Function is Asynchronous

`getUser` | `async getUser(email: string): Promise<Boolean>`
- Input parameters: email: string
- Output parameters: Promise<Boolean>
- Description: Function used by GET endpoints that takes a given email then checks if any user on the database has that email in their email field. If the email is tied to a user, it returns `true`. Else, it returns `false`.
- Function is Asynchronous

## Classes Functions
`getClasses` | `async getClasses(user_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number
- Output parameters: Promise<postgres.RowList<postgres.Row[]> | undefined>
- Description: Function takes a given user_id then provides all database fields for all Class table records where that user_id is the author. If user_id parameter is not defined, it returns `undefined`.
- Function is Asynchronous 

`createClass` | `async createClass(user_id: number, session: number, year: number, title: string, code: string): Promise<Boolean>`
- Input parameters: user_id: number, session: number, year: number, title: string, code: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters then inserts the parameters into the fields of a new record in the Class table and returns `true`. If user_id was not defined it returns `false`.
- Function is Asynchronous

`deleteClass` | `async deleteClass(user_id: number, class_id: number): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given user_id and class_id, if the user for that user_id exists and has the authority to delete the given class (if it exists), then it will delete the record in the Class table for that class_id and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editClass` | `async editClass(user_id: number, class_id: number, session: number, year: number, code: string, title: string): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number, session: number, year: number, code: string, title: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and class_id, if the user for the given id exists, and has the authority to edit the given class(if it exists), then it will update the class record fields to the given parameters and return `true`. Else, it returns `false`.
- Function is Asynchronous

`getNameOfClass` | ` async getNameOfClass(user_id: number, classID: number): Promise<string>`
- Input parameters: user_id: number, classID: number
- Output parameters: Promise<string>
- Description: Function takes several parameters including a user_id and classID, if the user for the given id exists, and has the authority to edit the given class, and the class exists, then returns the `code` field for that class record. Else, it returns `User does not posess such a class`.
- Function is Asynchronous
  
## Assignments Functions
`getAssignments` | `async getAssignments(user_id: number, specificClass: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number, specificClass: number
- Output parameters: Promise<postgres.RowList<postgres.Row[]> | undefined>
- Description: Function takes a given user_id and class_id, if the given user has the authority to edit the given class, it returns all fields for all records in the Assignments table which have the given class_id. If there are no such assignments records, it returns `undefined`.
- Function is Asynchronous 

`createAssignment` | `async createAssignment(user_id: number, class_id: number, name: string, description: string): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number, name: string, description: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and classID, if the user for the given id exists, and has the authority to edit the given class, then it inserts the parameters into the fields of a new record in the Assignments table and returns `true`. Else, it returns `false`.
- Function is Asynchronous

`deleteAssignment` | `async deleteAssignment(user_id: number, assignment_id: number): Promise<Boolean>`
- Input parameters: user_id: number, assignment_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given user_id and assignment_id, if the user for that user_id exists, and has the authority to delete the given assignment (if it exists), then it will delete the record in the Assignments table for that assignment_id and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editAssignment` | `async editAssignment(user_id: number, assignment_id: number, class_id: number, name: string, description: string, generic_questions: string): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number, session: number, year: number, code: string, title: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and assignment_id, if the user for the given id exists, and has the authority to edit the given assignment(if it exists), then it will update the assigment record fields to the given parameters and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
## Submissions Functions
`getSubmissionFilePathForSubID` | `async getSubmissionFilePathForSubID(specificSubmission: number): Promise<string>`
- Input parameters: specificSubmission: number
- Output parameters: Promise<string>
- Description: Function takes a given specificSubmission(submission_id) and returns the `submission_filepath` field for the record in the Submissions table with the given submission_id.
- Function is Asynchronous 

`getSubmissionsForAssignments` | `async getSubmissionsForAssignments(user_id: number, specificClass: number, specificAssignment: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number, specificClass: number, specificAssignment: number
- Output parameters: Promise<postgres.RowList<postgres.Row[]> | undefined>
- Description: Function takes a given user_id and specificClass(class_id) and specificAssignment(assignment_id), if the given user has the authority to edit the given class, it returns all fields for all records in the Submissions table which have the given assignment_id. If there are no such submissions records, it returns `undefined`.
- Function is Asynchronous 

`createSubmission` | `async createSubmission(user_id: number, assignment_id: number, student_id: number, submission_filepath: string): Promise<Boolean>`
- Input parameters: user_id: number, assignment_id: number, student_id: number, submission_filepath: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and classID, if the user for the given id exists, and has the authority to edit the given class, then it inserts the parameters into the fields of a new record in the Submissions table tied to the given assignment_id and returns `true`. Else, it returns `false`.
- Function is Asynchronous

`deleteSubmission` | `async deleteSubmission(user_id: number, submission_id: number): Promise<Boolean>`
- Input parameters: user_id: number, submission_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given user_id and submission_id, if the user for that user_id exists, and has the authority to delete the given submission (if it exists), then it will delete the record in the Submissions table for that submission_id, then delete the stored file at the name specified by the `submission_filepath`, and then, return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editSubmission` | `async editSubmission(user_id: number, submission_id: number, assignment_id: number, student_id: number, submission_date: string, submission_filepath: string): Promise<Boolean>`
- Input parameters: user_id: number, submission_id: number, assignment_id: number, student_id: number, submission_date: string, submission_filepath: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and submission_id, if the user for the given id exists, and has the authority to edit the given submission(if it exists), then it will update the submission record fields to the given parameters and return `true`. Else, it returns `false`.
- Function is Asynchronous

`getPDFFile` | `async getPDFFile(student_id: number, assignment_id: number): Promise<string | undefined>`
- Input parameters: specificSubmission: number
- Output parameters: Promise<string | undefined>
- Description: Function takes a given student_id and assignment_id then returns the `submission_filepath` field for the record in the Submissions table with the given student_id and assignment_id. If no such submission record exists it returns `null`.
- Function is Asynchronous

`postAIOutputForSubmission` | `async postAIOutputForSubmission(submission_id: number, generated_questions: string): Promise<Boolean>`
- Input parameters: submission_id: number, generated_questions: string
- Output parameters: Promise<Boolean>
- Description: Function takes a given submission_id and the output of the AI question generation function then edits the generated_questions and generation_date fields of the submission with the given id. It then returns `true`.
- Function is Asynchronous

`getQuestions` | `async getQuestions(submission_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: submission_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given submission_id then returns all fields for all records in the ai_output table with the given submission_id ordered by the generation_date field. If no such records are found, it returns `undefined`.
- Function is Asynchronous

## VivaExam Functions
`getExams` | `async getExams(submission_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: submission_id: number
- Output parameters: Promise<postgres.RowList<postgres.Row[]> | undefined>
- Description: Function takes a given submission_id then returns all fields for all records in the Exams table which have the given submission_id. If there are no such exam records, it returns `undefined`.
- Function is Asynchronous 

`createExams` | `async createExams(user_id: number, submission_id: number, student_id: number): Promise<Boolean>`
- Input parameters: user_id: number, submission_id: number, student_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a user_id, submission_id and student_id, then if the user for the given id exists, and has the authority to edit the given class, then it inserts the parameters into the fields of a new record in the Exams table and returns `true`. Else, it returns `false`.
- Function is Asynchronous

`deleteExam` | `async deleteExam(user_id: number, exam_id: number): Promise<Boolean>`
- Input parameters: user_id: number, exam_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given user_id and exam_id, if the user for that user_id exists, and has the authority to delete the given exam (if it exists), then it will delete the record in the Exams table for that exam_id and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editExam` | `async editExam(user_id: number, exam_id: number, submission_id: number, student_id: number, examiner_id: number, marks: number, comments: string): Promise<Boolean>`
- Input parameters: user_id: number, exam_id: number, submission_id: number, student_id: number, examiner_id: number, marks: number, comments: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and exam_id, if the user for the given id exists, and has the authority to edit the given exam(if it exists), then it will update the exam record fields to the given parameters and return `true`. Else, it returns `false`.
- Function is Asynchronous

## Students Functions
`getStudentsByClass` | `async getStudentsByClass(user_id: number, specificClass: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number, specificClass: number
- Output parameters: Promise<postgres.RowList<postgres.Row[]> | undefined>
- Description: Function takes a given specificClass(class_id) and user_id checks if the user has the authority to edit the given class, then returns all fields for all records in the Students table which have their student_id listed in the given class's studentIds field. If there are no such student records, it returns `undefined`.
- Function is Asynchronous

`addStudentToClass` | `async addStudentToClass(user_id: number, student_id: number, specificClass: number): Promise<Boolean>`
- Input parameters: user_id: number, student_id: number, specificClass: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given specificClass(class_id) and user_id checks if the user has the authority to edit the given class, then adds the given student_id to the given class's studentIds field, returning true after. Else, it returns `false`.
- Function is Asynchronous

`removeStudentFromClass` | `async removeStudentFromClass(user_id: number, student_id: number, specificClass: number): Promise<Boolean>`
- Input parameters: user_id: number, student_id: number, specificClass: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given specificClass(class_id) and user_id checks if the user has the authority to edit the given class, then removes the given student_id to the given class's studentIds field, returning true after. Else, it returns `false`.
- Function is Asynchronous

`updateStudentClass` | `async updateStudentClass(specificClass: number): Promise<void>`
- Input parameters: specificClass: number
- Output parameters: Promise<void>
- Description: Function takes a given specificClass(class_id) then seeks all student records listed in the given class's studentIds field, these student records then have their classes field updated to include or remove the class as appropriate.
- Function is Asynchronous

`getAllStudents` | `async getAllStudents()`
- Input parameters: NONE
- Output parameters: `any`, but takes the form of Promise<postgres.RowList<postgres.Row[]>
- Description: Function returns all fields for all records in the Students table.
- Function is Asynchronous

`deleteStudent` | async deleteStudent(user_id: number, student_id: number): Promise<Boolean>`
- Input parameters: user_id: number, student_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given user_id and student_id, if the user for that user_id exists, and has the authority to delete the given student (if it exists), then it will delete the record in the Students table for that student_id, then trace the database to delete every submission tied to that student and it's corresponding stored files, and finally, return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editStudent` | `async editStudent(email: string, student_id: number, first_name: string, last_name: string): Promise<Boolean>`
- Input parameters: email: string, student_id: number, first_name: string, last_name: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters then check if a record exists for the given student_id, then it will update the students record fields to the given parameters and return `true`. Else, it returns `false`.
- Function is Asynchronous

## Rubric Functions
`getRubricsForAssignments` | `async getRubricsForAssignments(user_id: number, specificClass: number, specificAssignment: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number, specificClass: number, specificAssignment: number
- Output parameters: Promise<postgres.RowList<postgres.Row[]> | undefined>
- Description: Function takes a given user_id, specificClass(class_id) and specificAssignment(assignment_id), checks if the given user has the authority to access the given class, then returns all fields for all records in the Rubric_Output table which have the given assignment_id. If there are no such rubric_output records, it returns `undefined`.
- Function is Asynchronous 

`postRubricForAssignment` | `async postRubricForAssignment(user_id: number, assignment_id: number, rubric: string): Promise<Boolean>`
- Input parameters: user_id: number, assignment_id: number, rubric: string
- Output parameters: Promise<Boolean>
- Description: Function takes a user_id, assignment_id and rubric, then if the user for the given id exists, and has the authority to edit the given assigment, then it inserts the parameters into the fields of a new record in the Rubric_Output table and returns `true`. Else, it returns `false`.
- Function is Asynchronous

`deleteRubric` | `async deleteRubric(user_id: number, rubric_id: number, class_id: number): Promise<Boolean>`
- Input parameters: user_id: number, rubric_id: number, class_id: number
- Output parameters: Promise<Boolean>
- Description: Function takes a given user_id and rubric_id(result_id), if the user for that user_id exists, and has the authority to delete the given rubric (if it exists), then it will delete the record in the Rubric_Output table for that result_id and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editRubric` | `async editRubric(user_id: number, rubric_id: number, assignment_id: number, class_id: number, rubric: string): Promise<Boolean>`
- Input parameters: user_id: number, rubric_id: number, assignment_id: number, class_id: number, rubric: string
- Output parameters: Promise<Boolean>
- Description: Function takes several parameters including a user_id and rubric_id, if the user for the given id exists, and has the authority to edit the given rubric_output(if it exists), then it will update the rubric_output record fields to the given parameters and return `true`. Else, it returns `false`.
- Function is Asynchronous
