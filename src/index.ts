import express from 'express';
import Service from './service.js';
import bodyParser from 'body-parser';


// Create the service instance, this will handle redis connections and business logic
const service = new Service();

// Global catch-all error handler
process.on('uncaughtException', function(err: string) {
    console.log('Uncaught exception: ' + err);
});

// Setup express with url encoded body parser
const PORT = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});



/**
 * Helper function to extract the ESDSA signature from the request object
 * 
 * @param req the request object passed from express
 * @param res the reponse object passed from express
 * @returns the signature from the header
 */
function checkForSignatureInHeader(req: express.request, res: express.response) : string {
    const signature = req.header('Authentication-Signature');
    if (!signature) {
        res.status(401).send('Missing signature');
    } 
    return signature;
}


/**
 * @api {post} /account Create an account
 * @apiName CreateAccount
 * 
 * @apiParam {json} body The account to create
 * @returns {json} The created account
 */
app.post('/account', async (req: express.request, res: express.response) => {
    const signature = checkForSignatureInHeader(req, res);
    try {
        const account = await service.createAccount(req.body, signature);
        res.status(200).send(account);
    } catch (error: any) {
        console.log(`errorMessage: ${error.message}`);
        res.status(500).send(error.message);
    }        
});


/**
 * @api {get} /account/:id Get an account
 * @apiName GetAccount
 * 
 * @apiParam {number} id The account ID
 * @returns {json} The account with included generated ID
 */
app.get('/account/:id', async (req: express.req, res: express.response) => {
    if(req.params.id) {
        try {
            const account = await service.getAccount(req.params.id);
            res.status(200).send(account);
        } catch (error: any) {
            if(error.message == 'Account not found') {
                res.status(404).send(error.message);
            }else {
                res.status(500).send(error.message);
            }
        }
    } else {
        res.status(400).send('Missing id');
    }
});

/**
 * @api {post} /message Send a message
 * @apiName SendMessage
 * 
 * @apiParam {json} body The message to send
 * @returns {json} The sent message with included generated ID
 */
app.post('/message', async (req: express.request, res: express.response) => {
    const signature = checkForSignatureInHeader(req, res);
    try {
        const messageWithId = await service.sendMessage(req.body, signature);
        res.status(200).send(messageWithId);
    } catch (error: any) {
        res.status(500).send(error.message); 
    }        
});


/**
 * @api {get} /message/:id Get a message
 * @apiName GetMessage
 * 
 * @apiParam {number} id The account ID
 * @returns {json} A list of messages for the given account
 */
app.get('/message/:id', async (req: express.request, res: express.res) => {
    const signature = checkForSignatureInHeader(req, res);;
    if(req.params.id) {
        try {
            const messages = await service.getMessages(req.params.id, signature);
            res.status(200).send(messages);
        } catch (error: any) {
            if(error.message == 'Account not found') {
                res.status(404).send(error.message);
            }else {
                res.status(500).send(error.message);
            }
        }
    } else {
        res.status(400).send('Missing id');
    }
});


