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

It should be noted that all scenarios not mentioned in the utilization of the below functions is handled by throwing errors and all functions frequently log error details as appropriate. The specifics of error handling and error messages will not be detailed in this document.

## User Functions
`getUserIDbyEmail` | `async getUserIDbyEmail(email: string): Promise<number>`
- Input parameters: email: string
- Output parameters : Promise<number>
- Description: Function takes a given Email and returns the first user_id in the database with that email. If there is no such user it returns `null`.
- Function is Asynchronous 

`getEmailbyUserID` | `async getEmailbyUserID(user_id: number): Promise<String>`
- Input parameters: user_id: number
- Output parameters : Promise<String>
- Description: Function takes a given database user_id then returns the email field for a user in the database with that user_id. If there is nothing in the user's email field, it returns `undefined`.
- Function is Asynchronous 

`loginUserCheck` | `async loginUserCheck(email: string): Promise<Boolean>`
- Input parameters: email: string
- Output parameters : Promise<Boolean>
- Description: Function takes a given email then checks if any user on the database has that email in their email field. If the email is tied to a user it returns `true`, else, it returns `false`.
- Function is Asynchronous 

`updateLastLoggedIn` | `async updateLastLoggedIn(userID: number): Promise<void>`
- Input parameters: userID: number
- Output parameters : Promise<void>
- Description: Function takes a given database user_id then sets the last_login_date field of the user with that user_id to the current time using `Now()`. The Promise<void> function returns nothing.
- Function is Asynchronous 

`getHashedPasswordFromDatabase` | `async getHashedPasswordFromDatabase(email: string): Promise<string>`
- Input parameters: email: string
- Output parameters : Promise<string>
- Description: Function takes a given email then returns the hashed password for the user that has the given email.
- Function is Asynchronous

`signupUser` | `async signupUser(email: string, hashedPassword: string, user_name: string, first_name: string, last_name: string): Promise<Boolean>`
- Input parameters: email: string, hashedPassword: string, user_name: string, first_name: string, last_name: string
- Output parameters : Promise<Boolean>
- Description: Function takes several paramaters, if the email is not used by an existing user it inserts the paramaters into the fields of a new record in the Users table and returns `true`. Else, if the email is used by an existing user it returns `false`.
- Function is Asynchronous

`getUser` | `async getUser(email: string): Promise<Boolean>`
- Input parameters: email: string
- Output parameters : Promise<Boolean>
- Description: Function used by GET endpoints that takes a given email then checks if any user on the database has that email in their email field. If the email is tied to a user it returns `true`, else, it returns `false`.
- Function is Asynchronous

## Classes Functions
`getClasses` | `async getClasses(user_id: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number
- Output parameters : Promise<postgres.RowList<postgres.Row[]>
- Description: Function takes a given user_id then provides all database fields for all Class table records where that user_id is the author. If user_id paramater is not defined, it returns `undefined`.
- Function is Asynchronous 

`createClass` | `async createClass(user_id: number, session: number, year: number, title: string, code: string): Promise<Boolean>`
- Input parameters: user_id: number, session: number, year: number, title: string, code: string
- Output parameters : Promise<Boolean>
- Description: Function takes several paramaters then inserts the paramaters into the fields of a new record in the Class table and returns `true`. If user_id was not defined it returns `false`.
- Function is Asynchronous

`deleteClass` | `async deleteClass(user_id: number, class_id: number): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number
- Output parameters : Promise<Boolean>
- Description: Function takes a given user_id and class_id, if the user for that user_id exists, and has the authority to delete the given class (if it exists), then it will delete the record in the Class table for that class_id and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editClass` | `async editClass(user_id: number, class_id: number, session: number, year: number, code: string, title: string): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number, session: number, year: number, code: string, title: string
- Output parameters : Promise<Boolean>
- Description: Function takes several paramaters including a user_id and class_id, if the user for the given id exists, and has the authority to edit the given class(if it exists), then it will update the class record fields to the given paramaters and return `true`. Else, it returns `false`.
- Function is Asynchronous

`getNameOfClass` | ` async getNameOfClass(user_id: number, classID: number): Promise<string>`
- Input parameters: user_id: number, classID: number
- Output parameters : Promise<string>
- Description: Function takes several paramaters including a user_id and classID, if the user for the given id exists, and has the authority to edit the given class, and the class exists, then returns the `code` field for that class record. Else, it returns `User does not posess such a class`.
- Function is Asynchronous
  
## Assignments Functions
`getClasses` | `async getAssignments(user_id: number, specificClass: number): Promise<postgres.RowList<postgres.Row[]> | undefined>`
- Input parameters: user_id: number, specificClass: number
- Output parameters : Promise<postgres.RowList<postgres.Row[]>
- Description: Function takes a given user_id and class_id, if the given user has the authority to edit the given class, it returns all fields for all records in the Assignments table which have the given class_id. If there are no such assignments records, it returns `undefined`.
- Function is Asynchronous 

`createAssignment` | `async createAssignment(user_id: number, class_id: number, name: string, description: string): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number, name: string, description: string
- Output parameters : Promise<Boolean>
- Description: Function takes several paramaters including a user_id and classID, if the user for the given id exists, and has the authority to edit the given class, then it inserts the paramaters into the fields of a new record in the Assignments table and returns `true`. Else, it returns `false`.
- Function is Asynchronous

`deleteAssignment` | `async deleteAssignment(user_id: number, assignment_id: number): Promise<Boolean>`
- Input parameters: user_id: number, assignment_id: number
- Output parameters : Promise<Boolean>
- Description: Function takes a given user_id and assignment_id, if the user for that user_id exists, and has the authority to delete the given assignment (if it exists), then it will delete the record in the Assignments table for that class_id and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
`editAssignment` | `async editAssignment(user_id: number, assignment_id: number, class_id: number, name: string, description: string, generic_questions: string): Promise<Boolean>`
- Input parameters: user_id: number, class_id: number, session: number, year: number, code: string, title: string
- Output parameters : Promise<Boolean>
- Description: Function takes several paramaters including a user_id and assignment_id, if the user for the given id exists, and has the authority to edit the given assignment(if it exists), then it will update the assigment record fields to the given paramaters and return `true`. Else, it returns `false`.
- Function is Asynchronous
  
## Submissions Functions
