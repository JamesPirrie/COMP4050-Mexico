CREATE TABLE users (
user_id serial primary key,
username text,
pass text,
first_name text,
last_name text,
email text,
is_admin Boolean,
last_login_date timestamptz
);

CREATE TABLE class (
class_id serial primary key,
session int2,
year int2,
code varchar(8),
title text,
creation_date timestamptz,
expiry_date timestamptz,
author_id int4,
tutors integer array,
students integer array
);

CREATE TABLE assignments (
assignment_id serial primary key,
class_id int4,
name text,
description text,
generic_questions jsonb
);

CREATE TABLE submissions (
submission_id serial primary key,
assignment_id int4,
student_id int4,
submission_date timestamptz,
submission_filepath text
);

CREATE TABLE students (
student_id int4 primary key,
first_name text,
last_name text,
email text,
classes integer array DEFAULT ARRAY[]::integer[]
);

CREATE TABLE exams (
exam_id serial primary key,
submission_id int4,
student_id int4,
marks int2,
comments text,
examiner_id int4
);

CREATE TABLE ai_output (
result_id serial primary key,
submission_id int4,
generated_questions jsonb,
generation_date timestamptz,
score int2
);

CREATE TABLE rubric_output (
result_id serial primary key,
assignment_id int4,
author_id int4,
rubric_json jsonb,
generation_date timestamptz
);

INSERT INTO students (student_id, first_name, last_name, email, classes) VALUES (11111111, 'John', 'Smith', 'test.account@students.mq.edu.au', ARRAY[1]);
INSERT INTO students (student_id, first_name, last_name, email) VALUES (12345678, 'John', 'Appleseed', 'test2.account@students.mq.edu.au');
INSERT INTO students (student_id, first_name, last_name, email) VALUES (22222222, 'John', 'Bravo', 'test3.account@students.mq.edu.au');
INSERT INTO students (student_id, first_name, last_name, email) VALUES (33333333, 'John', 'Charlie', 'test4.account@students.mq.edu.au');
INSERT INTO students (student_id, first_name, last_name, email, classes) VALUES (44444444, 'John', 'Delta', 'test5.account@students.mq.edu.au', ARRAY[1]);

INSERT INTO class (session, year, code, title, author_id, students) VALUES (2, 2024, 'TEST2020', 'students array test', 1, ARRAY[11111111, 44444444]);