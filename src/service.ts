import redis from 'redis';
import Account from './account.js';
import crypto from 'crypto';

export default class Service {
    private validateSignature(publicKey: string, signature: string, message: string) {
        console.log(`PublicKey: ${publicKey}\nSignature: ${signature}\nMessage: ${message}`);
        const verify = crypto.createVerify('SHA256')
        verify.update(message)
        if(!verify.verify(publicKey, signature, 'base64')) {
            throw new Error("Invalid signature");
        }
    }

    async connect() : Promise<redis.RedisClient> {
        let client
        if(process.env.REDIS_URL) {
            client = redis.createClient({url: process.env.REDIS_URL, socket: {
                tls: true,
                rejectUnauthorized: false,
                connectTimeout: 3000,
              }});
        } else {
            client = redis.createClient();
        }
        await client.connect();
        return client
    }

    async createAccount(newAccount: any, signature: string): Promise<Account> {
        const client = await this.connect();
        if(!newAccount) {
            throw new Error("Missing body");
        }
        this.validateSignature(newAccount.publicKey, signature, JSON.stringify(newAccount))
        const id = await client.incr('id-counter');
        const createdAccount = new Account(newAccount.name, newAccount.publicKey, id);
        await client.set(id, JSON.stringify(createdAccount));
        await client.disconnect();
        return createdAccount;
    }

    async getAccount(id: number): Promise<Account> {
        const client = await this.connect();
        const account = await client.get(id);
        await client.disconnect();
        if(!account) {
            throw new Error("Account not found");
        } else {
            return JSON.parse(account) as Account;
        }
    }

    async sendMessage(message: any, signature: string): Promise<string> {
        const client = await this.connect();
        if(!message) {
            throw new Error("Missing body");
        }
        const senderAccount = await this.getAccount(message.senderId);
        this.validateSignature(senderAccount.publicKey, signature, JSON.stringify(message))
        const recipient = message.recipientId; 
        if(!await client.exists(recipient)) {
            throw new Error("Recipient does not exist");
        }
        const counter = await client.incr(`${recipient}:count`);
        message.messageId = counter;
        const messageString = JSON.stringify(message)
        if (message.ttl) {
            console.log(`${recipient}:message:${counter}  ${messageString} EX ${message.ttl}`);
            await client.set(`${recipient}:message:${counter}`, messageString, {'EX': message.ttl});
        } else {
            console.log(`${recipient}:message:${counter}  ${messageString}`);
            await client.set(`${recipient}:message:${counter}`, messageString);            
        }
        await client.disconnect();
        return messageString
    }

    async getMessages(id: number, signature: string): Promise<Array<string>> {
        const client = await this.connect();;
        const senderAccount = await this.getAccount(id);
        this.validateSignature(senderAccount.publicKey, signature, `${id}`);

        const messages: Array<string> = [];
        if(!await client.exists(id)) {
            throw new Error("Recipient does not exist");
        }
        console.log(`${id}:message-*`);
        const scanIterator = client.scanIterator({TYPE: 'string', MATCH: `${id}:message:*`});
        for await (const key of scanIterator) {
            let message = await client.getDel(key);
            message = JSON.parse(message);
            console.log(`Key: ${key} Message: ${message}`);
            messages.push(message);
        }
        await client.disconnect();
        return messages;
    }
}