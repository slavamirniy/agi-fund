import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { generateProxyAgents } from '../gpt.js';

const TOKEN_FILE = path.join(process.cwd(), 'reddit_token.json');

interface TokenData {
    accessToken: string;
    expiresAt: number;
}

export class RedditTokenManager {
    private static instance: RedditTokenManager;
    private currentToken: TokenData | null = null;

    private constructor() {}

    public static getInstance(): RedditTokenManager {
        if (!RedditTokenManager.instance) {
            RedditTokenManager.instance = new RedditTokenManager();
        }
        return RedditTokenManager.instance;
    }

    private async loadTokenFromFile(): Promise<TokenData | null> {
        try {
            const data = await fs.readFile(TOKEN_FILE, 'utf-8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    private async saveTokenToFile(token: TokenData): Promise<void> {
        await fs.writeFile(TOKEN_FILE, JSON.stringify(token));
    }

    private async fetchNewToken(): Promise<TokenData> {
        const clientAuth = {
            username: process.env.REDDIT_APP_ID || '',
            password: process.env.REDDIT_APP_SECRET || ''
        };

        const postData = {
            grant_type: "password",
            username: process.env.REDDIT_USERNAME || '',
            password: process.env.REDDIT_PASSWORD || ''
        };

        const headers = {
            "User-Agent": "CryptoAnalyzer/0.1 by Remote-Rate-2313"
        };

        const response = await axios.post(
            'https://www.reddit.com/api/v1/access_token',
            new URLSearchParams(postData),
            {
                auth: clientAuth,
                headers,
                ...generateProxyAgents(true)
            }
        );

        const tokenData: TokenData = {
            accessToken: response.data.access_token,
            expiresAt: Date.now() + (response.data.expires_in * 1000)
        };

        await this.saveTokenToFile(tokenData);
        return tokenData;
    }

    private isTokenValid(token: TokenData): boolean {
        return Date.now() < token.expiresAt - 60000 * 5; // 5 минут запас
    }

    public async getRedditToken(): Promise<string> {
        try {
            // Проверяем текущий токен в памяти
            if (this.currentToken && this.isTokenValid(this.currentToken)) {
                return this.currentToken.accessToken;
            }

            // Пробуем загрузить токен из файла
            const savedToken = await this.loadTokenFromFile();
            if (savedToken && this.isTokenValid(savedToken)) {
                this.currentToken = savedToken;
                return savedToken.accessToken;
            }

            // Получаем новый токен
            const newToken = await this.fetchNewToken();
            this.currentToken = newToken;
            return newToken.accessToken;
        } catch (error) {
            console.error('Ошибка при получении токена Reddit:', error);
            throw error;
        }
    }
}

export const redditTokenManager = RedditTokenManager.getInstance();