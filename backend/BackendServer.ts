//https://expressjs.com/en/5x/api.html    

import * as express from 'express';
import {Request, Response} from 'express';

const app = express();
const port = 8080;

app.use(express.json());//without this req.body is undefined

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

//start the server
app.listen(port, () => {
    console.log('listening at port:', port);
});