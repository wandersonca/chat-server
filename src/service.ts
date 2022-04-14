import redis from 'redis';
import Account from './account.js';
import crypto from 'crypto';

export default class Service {
    redis: any;
    connected = false;

    constructor() {
        if(process.env.REDIS_URL) {
            this.redis = redis.createClient({url: process.env.REDIS_URL,   socket: {
                tls: true,
                rejectUnauthorized: false,
              }});
        } else {
            this.redis = redis.createClient();
        }
    }

    private validateSignature(publicKey: string, signature: string, message: string) {
        console.log(`PublicKey: ${publicKey}\nSignature: ${signature}\nMessage: ${message}`);
        const verify = crypto.createVerify('SHA256')
        verify.update(message)
        if(!verify.verify(publicKey, signature, 'base64')) {
            throw new Error("Invalid signature");
        }
    }

    async connect() {
        //if(!this.connected) {
            await this.redis.connect();
            this.connected = true;
        //}
    }

    async createAccount(newAccount: any, signature: string): Promise<Account> {
        await this.connect();
        if(!newAccount) {
            throw new Error("Missing body");
        }
        this.validateSignature(newAccount.publicKey, signature, JSON.stringify(newAccount))
        const id = await this.redis.incr('id-counter');
        const createdAccount = new Account(newAccount.name, newAccount.publicKey, id);
        await this.redis.set(id, JSON.stringify(createdAccount));
        return createdAccount;
    }

    async getAccount(id: number): Promise<Account> {
        await this.connect();
        const account = await this.redis.get(id);
        if(!account) {
            throw new Error("Account not found");
        } else {
            return JSON.parse(account) as Account;
        }
    }

    async sendMessage(message: any, signature: string): Promise<string> {
        await this.connect();
        if(!message) {
            throw new Error("Missing body");
        }
        const senderAccount = await this.getAccount(message.senderId);
        this.validateSignature(senderAccount.publicKey, signature, JSON.stringify(message))
        const recipient = message.recipientId; 
        if(!await this.redis.exists(recipient)) {
            throw new Error("Recipient does not exist");
        }
        const counter = await this.redis.incr(`${recipient}:count`);
        message.messageId = counter;
        const messageString = JSON.stringify(message)
        console.log(`${recipient}:message:${counter}  ${messageString} EX ${message.ttl || 60}`);
        await this.redis.set(`${recipient}:message:${counter}`, messageString, {'EX': message.ttl || 60});
        return messageString
    }

    async getMessages(id: number): Promise<Array<string>> {
        await this.connect();
        const messages: Array<string> = [];
        if(!await this.redis.exists(id)) {
            throw new Error("Recipient does not exist");
        }
        console.log(`${id}:message-*`);
        const scanIterator = this.redis.scanIterator({TYPE: 'string', MATCH: `${id}:message:*`});
        for await (const key of scanIterator) {
            let message = await this.redis.get(key);
            message = JSON.parse(message);
            console.log(`Key: ${key} Message: ${message}`);
            messages.push(message);
        }
        return messages;
    }
}