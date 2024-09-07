import {Request} from 'express';

//REQUEST INTERFACES

export interface loginRequest extends Request {
    email?: string;
    password?: string; 
}

export interface getClassesRequest extends Request {
    email?: string;
}

export interface postClassesRequest extends Request {
    email?: string;
    code?: string;
}

export interface getAssignmentsRequest extends Request {
    email?: string;
    class_id?: string;
}

export interface postAssignmentsRequest extends Request {
    email?: string;
    class_id?: number;
    _name?: string;//_ to differenciate from the global Function classes .name
    description?: string;
}

export interface getSubmissionsRequest extends Request {
    email?: string;
    class_id?: string;
    assignment_id?: string;
}

export interface postSubmissionsRequest extends Request {
    email?: string;
    class_id?: string;
    student_id?: number;
    assignment_id?: number;
    submission_date?: Date;
    submission_filepath?: string;
}

export interface qGenRequest extends Request {
    email?: string;
    submission_id?: string;
    result_id?: string;
}

export interface getVivasRequest extends Request {

}

export interface postVivasRequest extends Request {

}

//to be continued

/* --------------------------------------------------------------------------- */