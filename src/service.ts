import redis from 'redis';
import crypto from 'crypto';


/**
 * The service class handles redis connections and business logic
 */
export default class Service {
    /**
     * Validates the ESDA signature of a message using the public key of the sender
     * 
     * @param publicKey 
     * @param signature 
     * @param message 
     */
    private validateSignature(publicKey: string, signature: string, message: string) {
        console.log(`PublicKey: ${publicKey}\nSignature: ${signature}\nMessage: ${message}`);
        const verify = crypto.createVerify('SHA256');
        verify.update(message);
        if(!verify.verify(publicKey, signature, 'base64')) {
            throw new Error('Invalid signature');
        }
    }

    /**
     * Returns a connected redis connection.
     * 
     * @returns Promise<redis.RedisClient>
     */
    async connect() : Promise<redis.RedisClient> {
        let client;
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
        return client;
    }

    /**
     * Creates a new account, stores it in redis and returns it with its new ID
     * 
     * @param newAccount - the account to be created
     * @param signature - the signature of the account
     * @returns - the account with generated ID
     */
    async createAccount(newAccount: any, signature: string): Promise<string> {
        const client = await this.connect();
        if(!newAccount) {
            throw new Error('Missing body');
        }
        this.validateSignature(newAccount.publicKey, signature, JSON.stringify(newAccount));
        newAccount.id = await client.incr('account:count');
        await client.set(newAccount.id, JSON.stringify(newAccount));
        await client.disconnect();
        return newAccount;
    }

    /**
     * Gets an account from redis by ID
     * 
     * @param id - the id of the account
     * @returns - the account
     */
    async getAccount(id: number): Promise<string> {
        const client = await this.connect();
        const account = await client.get(id);
        await client.disconnect();
        if(!account) {
            throw new Error('Account not found');
        } else {
            return account;
        }
    }

    /**
     * Saves the message to redis using the recipient's ID as key
     * 
     * @param message - the message to be sent
     * @param signature - the signature of the message
     * @returns - the message with generated ID
     */
    async sendMessage(message: any, signature: string): Promise<string> {
        const client = await this.connect();
        if(!message) {
            throw new Error('Missing body');
        }
        const senderAccount = await JSON.parse(await this.getAccount(message.senderId));
        this.validateSignature(senderAccount.publicKey, signature, JSON.stringify(message));
        const recipient = message.recipientId; 
        if(!await client.exists(recipient)) {
            throw new Error('Recipient does not exist');
        }
        const counter = await client.incr(`${recipient}:count`);
        message.messageId = counter;
        const messageString = JSON.stringify(message);
        if (message.ttl) {
            console.log(`${recipient}:message:${counter}  ${messageString} EX ${message.ttl}`);
            await client.set(`${recipient}:message:${counter}`, messageString, {'EX': message.ttl});
        } else {
            console.log(`${recipient}:message:${counter}  ${messageString}`);
            await client.set(`${recipient}:message:${counter}`, messageString);            
        }
        await client.disconnect();
        return messageString;
    }

    /**
     * Gets a list of messages for a recipient by ID
     * 
     * @param id - the id of the account
     * @param signature - the signature of the account ID
     * @returns - a list of messages
     */
    async getMessages(id: number, signature: string): Promise<Array<string>> {
        const client = await this.connect();
        const senderAccount = JSON.parse(await this.getAccount(id));
        this.validateSignature(senderAccount.publicKey, signature, `${id}`);

        const messages: Array<string> = [];
        if(!await client.exists(id)) {
            throw new Error('Recipient does not exist');
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