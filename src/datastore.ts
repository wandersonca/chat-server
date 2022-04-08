import redis from 'redis';

export default class DataStore {
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

    async setKey(key: string, value: string) {
        this.connect();
        await this.redis.set(key, value);
    }

    async getKey(key: string): Promise<string> {
        this.connect();
        const value = await this.redis.get(key);
        return value;
    }
}