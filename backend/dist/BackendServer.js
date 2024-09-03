"use strict";
//https://expressjs.com/en/5x/api.html    
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var app = express();
var port = 8080;
app.use(express.json()); //without this req.body is undefined
//GET requests
app.get('/', function (req, res) {
    console.log('GET request received');
    res.send('GET request received');
});
//POST requests
app.post('/', function (req, res) {
    console.log('POST request received');
    res.send('POST Request received');
    console.log('headers:');
    console.log(req.headers);
    console.log('body: ');
    console.log(req.body);
    console.log('parameters');
    console.log(req.params);
    console.log('ip');
    console.log(req.ip); //will probably be ::1 in localhost
});
//PUT requests
app.put('/', function (req, res) {
    console.log('PUT request received');
    res.send('PUT Request received');
});
//start the server
app.listen(port, function () {
    console.log('listening at port:', port);
});
