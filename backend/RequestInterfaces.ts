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
    email: string;
    code: string;
}

export interface getAssignmentsRequest extends Request {
    email: string;
    classID: string;
}

export interface postAssignmentsRequest extends Request {
    email: string;
    classID: string;
    _name: string;//_ to differenciate from the global Function classes .name
    description: string;
}

export interface getSubmissionsRequest extends Request {
    email: string;
    classID: string;
    assignment_id: string;
}

export interface postSubmissionsRequest extends Request {
    email: string;
    classID: string;
    assignment_id: string;
    submission_date: string;
}

export interface qGenRequest extends Request {
    email: string;
    submission_id: string;
    resultID: string;
}

//to be continued

/* --------------------------------------------------------------------------- */