import express from 'express';
import Service from './service.js';
import bodyParser from 'body-parser';
import * as e from 'express';

const PORT = process.env.PORT || 3000;

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

const service = new Service();

process.on('uncaughtException', function(err: string) {
    console.log('Uncaught exception: ' + err);
});

// Create and read accounts
app.post('/account', async (req: express.req, res: express.res) => {
    const signature = req.header('Authentication-Signature');
    if(signature){
        try {
            const account = await service.createAccount(req.body, signature);
            res.status(200).send(account);
        } catch (error: any) {
            console.log(`errorMessage: ${error.message}`);
            res.status(500).send(error.message);
        }        
    } else {
        res.status(401).send('Unauthorized - missing Authentication-Signature header');
    }
});

app.get('/account/:id', async (req: express.req, res: express.res) => {
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

// Create and read messages
app.post('/message', async (req: express.req, res: express.res) => {
    const signature = req.header('Authentication-Signature');
    if(signature){
        try {
            const messageWithId = await service.sendMessage(req.body, signature);
            res.status(200).send(messageWithId);
        } catch (error: any) {
            res.status(500).send(error.message); 
        }        
    } else {
        res.status(401).send('Unauthorized - missing Authentication-Signature header');
    }
});

app.get('/message/:id', async (req: express.req, res: express.res) => {
    if(req.params.id) {
        try {
            const messages = await service.getMessages(req.params.id);
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

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
});

