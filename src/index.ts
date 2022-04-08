import express from 'express';
import Service from './service.js';
import bodyParser from 'body-parser';

const PORT = process.env.PORT || 3000;

const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

const service = new Service();

// Create and read accounts
app.post('/account', async (req: express.req, res: express.res) => {
    const account = await service.createAccount(req.body);
    res.status(200).send(account);
});

app.get('/account/:id', async (req: express.req, res: express.res) => {
    const account = await service.getAccount(req.params);
    res.status(200).send(account);
});

// Create and read messages
app.post('/message', async (req: express.req, res: express.res) => {
    await service.sendMessage(req.body);
    res.status(200).send('sucess');
});

app.get('/message/:id', async (req: express.req, res: express.res) => {
    const messages = await service.getMessages(req.params.id);
    res.status(200).send(messages);
});

app.listen(PORT, async () => {
    service.connect();
    console.log(`Server running on port ${PORT}`);
});