//https://expressjs.com/en/5x/api.html    

import * as express from 'express';
import {Request, Response} from 'express';

const app = express();
const port = 8080;

app.use(express.json());//without this req.body is undefined

//placeholders for now
//GET requests
app.get('/', (req: Request, res: Response) => {
    console.log('GET request received');
    res.send('GET request received');
});

//POST requests
app.post('/', (req: Request, res: Response) => {
    console.log('POST request received');
    res.send('POST Request received');

    console.log('headers:');
    console.log(req.headers);

    console.log('body: ');
    console.log(req.body);

    console.log('parameters');
    console.log(req.params);

    console.log('ip');
    console.log(req.ip);//will probably be ::1 in localhost
});

//PUT requests
app.put('/', (req: Request, res: Response) => {
    console.log('PUT request received');
    res.send('PUT Request received')
});

//actual endpoints (my understanding of how this will work please correct this if im wrong)
app.post('/api/login', (req: Request, res: Response) => {
    //for MVP (logging in)
    //we will receive email and password
    //is email in database?
    //if so send success = true
    //if not success = false
});

app.post('/api/signup', (req: Request, res: Response) => {
    //for MVP (signing up)
    //we will receive email and password
    //is email already used in database?
    //if so send success = false
    //if not used success = true (im assuming we will add to database also)
});

app.get('/api/classes', (req: Request, res: Response) =>{
    //for MVP (listing classes)
    // get list of classes of the user (how we are doing sessions though)
});

app.post('/api/classes', (req: Request, res: Response) =>{
    //for MVP (adding removing classes)
    //adding classes for that user
});

app.get('/api/assignments', (req: Request, res: Response) =>{
    //for MVP (listing classes)
    //list assignments for a specific class
});

app.post('/api/assignments', (req: Request, res: Response) =>{
    //for MVP adding removing assignments
    //adding assignments to that class
});

app.get('/api/vivas', (req: Request, res: Response) =>{
    //for MVP listing vivas
});

app.post('/api/vivas', (req: Request, res: Response) =>{
    //for MVP adding and removing vivas
});



//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});