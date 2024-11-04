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
## Login/Out Functions
`getUserIDbyEmail' | `async getUserIDbyEmail(email: string): Promise<number>`
- Input parameters: email: string
- Output parameters : Promise<number>
- Description: Function takes a given Email and returns the first user_ID in the database with that email. Else it returns "null"

