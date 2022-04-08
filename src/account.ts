import { v4 as uuidv4 } from 'uuid';

export default class Account {
    private _name: string;
    private _publicKey: string;
    private _id: string;

    constructor(name: string, publicKey: string) {
        this._name = name;
        this._publicKey = publicKey;
        this._id = uuidv4();
    }

    get name(): string {
        return this._name;
    }

    get publicKey(): string {
        return this._publicKey;
    }

    get id(): string {
        return this._id;
    }
}