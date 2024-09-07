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
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const PORT = 8080;
//send the request as a JSON 
const requestBody = JSON.stringify({ message: 'Hello, server!',
    test1: 'hello again'
});
//details of the request
const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
    },
};
//the response handler for when we receive the response from the server
const req = http.request(options, (response) => {
    let ResponseString = ''; //start building response
    response.on('data', (chunk) => {
        ResponseString += chunk;
    });
    response.on('end', () => {
        console.log('Response:', ResponseString);
    });
});
req.on('error', (error) => {
    console.error('Request error:', error);
});
//actually send the request
req.write(requestBody);
req.end();
