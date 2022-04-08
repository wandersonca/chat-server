import redis from 'redis';
import Account from './account.js';

export default class Service {
    redis: any;
    connected = false;

    constructor() {
        if(process.env.REDIS_URL) {
            this.redis = redis.createClient({url: process.env.REDIS_URL});
        } else {
            this.redis = redis.createClient();
        }
    }

    async connect() {
        if(!this.connected) {
            await this.redis.connect();
            this.connected = true;
        }
    }

    async createAccount(body: any): Promise<Account> {
        const account = new Account(body.name, body.publicKey);
        await this.redis.set(account.id, JSON.stringify(account));
        return account;
    }

    async getAccount(params: any): Promise<Account> {
        const account = await this.redis.get(params.id);
        return JSON.parse(account) as Account;
    }

    async sendMessage(body: any): Promise<void> {
        const recipients: Array<string> = body.recipients.split(','); 
        for(const recipient of recipients) {
            if(!await this.redis.exists(recipient)) {
                throw new Error("Recipient does not exist");
            }
            const counter = await this.redis.incr(`${recipient}:count`);
            console.log(`${recipient}:message-${counter}  ${body.message} EX ${body.ttl || 60}`);
            await this.redis.set(`${recipient}:message-${counter}`, body.message, {'EX': body.ttl || 60});
        }
    }

    async getMessages(id: number): Promise<Array<string>> {
        const messages: Array<string> = [];
        if(!await this.redis.exists(id)) {
            throw new Error("Recipient does not exist");
        }
        console.log(`${id}:message-*`);
        const scanIterator = this.redis.scanIterator({TYPE: 'string', MATCH: `${id}:message-*`});
        for await (const key of scanIterator) {
            const message = await this.redis.get(key);
            console.log(`Key: ${key} Message: ${message}`);
            messages.push(message);
        }
        return messages;
    }
}