import fs from 'fs/promises';

export class Storage<K, V> {
    private data: Map<K, V> | null = null;
    private getter: () => Promise<Map<K, V>>;
    private setter: (value: Map<K, V>) => Promise<void>;


    constructor(
        getter: () => Promise<Map<K, V>>,
        setter: (value: Map<K, V>) => Promise<void>
    ) {
        this.getter = getter;
        this.setter = setter;
    }

    async get(key: K): Promise<V | undefined> {
        if (!this.data) {
            this.data = await this.getter();
        }
        return this.data.get(key);
    }

    async getAll(): Promise<Map<K, V>> {
        if (!this.data) {
            this.data = await this.getter();
        }
        return this.data;
    }

    async listKeys(): Promise<K[]> {
        if (!this.data) {
            this.data = await this.getter();
        }
        return Array.from(this.data.keys());
    }

    async set(key: K, value: V): Promise<void> {
        if (!this.data) {
            this.data = await this.getter();
        }
        this.data.set(key, value);
        await this.setter(this.data);
    }

    async delete(key: K): Promise<boolean> {
        if (!this.data) {
            this.data = await this.getter();
        }
        const result = this.data.delete(key);
        if (result) {
            await this.setter(this.data);
        }
        return result;
    }

    async has(key: K): Promise<boolean> {
        if (!this.data) {
            this.data = await this.getter();
        }
        return this.data.has(key);
    }

    clear(): void {
        this.data = null;
    }
}

export function createFileStorage<K, V>(filePath: string): Storage<K, V> {
    const getter = async () => {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const parsed = JSON.parse(data);
            return new Map(Object.entries(parsed)) as Map<K, V>;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return new Map<K, V>();
            }
            throw error;
        }
    };

    const setter = async (value: Map<K, V>) => {
        const obj = Object.fromEntries(value);
        await fs.writeFile(filePath, JSON.stringify(obj, null, 2));
    };

    return new Storage(getter, setter);
}
