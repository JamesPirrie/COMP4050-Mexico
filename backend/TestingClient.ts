import * as http from 'http';


const PORT: number = 8080;

//send the request as a JSON 
const requestBody = JSON.stringify({message: 'Hello, server!',
                                    test1:   'hello again'
});

//details of the request
    const options: http.RequestOptions = {
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
    const req = http.request(options, (response: any) => {
        let ResponseString = '';//start building response
    

        response.on('data', (chunk : Buffer) => {//for every data chunk add to the response
            ResponseString += chunk;
        });
    

        response.on('end', () => {//when we are at the end print the response
            console.log('Response:', ResponseString);
        });

    });

    req.on('error', (error) => {//display the error not too sure on how these work yet
        console.error('Request error:', error);
    });

    //actually send the request
    req.write(requestBody);
    req.end();