"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var PORT = 8080;
//send the request as a JSON 
var requestBody = JSON.stringify({ message: 'Hello, server!',
    test1: 'hello again'
});
//details of the request
var options = {
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
var req = http.request(options, function (response) {
    var ResponseString = ''; //start building response
    response.on('data', function (chunk) {
        ResponseString += chunk;
    });
    response.on('end', function () {
        console.log('Response:', ResponseString);
    });
});
req.on('error', function (error) {
    console.error('Request error:', error);
});
//actually send the request
req.write(requestBody);
req.end();
