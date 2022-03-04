import express from 'express';
import { createClient } from 'redis';


const PORT = process.env.PORT || 3000;
const app = express();


async function returnRedisConnection() {
    let client;
    if(process.env.REDIS_URL) {
        client = createClient(process.env.REDIS_URL);
    } else {
        client = createClient();
    }
    await client.connect();
    return client;
}


app.get('/write', async (req, res) => {
    const client = await returnRedisConnection();

    await client.set('key', 'hello world');
    res.status(200).send('Wrote Value');
});

app.get('/read', async (req, res) => {
    const client = await returnRedisConnection();

    const value = await client.get('key');

    res.status(200).send(value);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});