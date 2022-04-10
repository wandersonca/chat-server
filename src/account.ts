export default class Account {
    name: string;
    publicKey: string;
    id: number;

    constructor(name: string, publicKey: string, id: number) {
        this.name = name;
        this.publicKey = publicKey;
        this.id = id;
    }

    getName(): string {
        return this.name;
    }

    getPublicKey(): string {
        return this.publicKey;
    }

    getId(): number {
        return this.id;
    }
}