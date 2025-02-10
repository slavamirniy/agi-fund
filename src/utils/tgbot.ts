import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { createFileStorage } from './storage.js';

const token: string = process.env.TELEGRAM_BOT_TOKEN as string;
const mainChatId: string = process.env.MAIN_CHAT_ID as string;

if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
}

if (!mainChatId) {
    throw new Error('MAIN_CHAT_ID is not set in environment variables');
}

const bot = new TelegramBot(token);

export async function createTopic(title: string) {
    try {
        const result = await bot.createForumTopic(mainChatId, title);

        if (!result) {
            throw new Error('Failed to create topic');
        }
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const messages = await bot.getUpdates();

            const topicMessage = messages.find(update =>
                update.message?.forum_topic_created &&
                update.message.forum_topic_created.name === title
            );

            if (topicMessage?.message?.message_thread_id) {
                return {
                    message_id: topicMessage.message.message_thread_id,
                    name: title
                };
            }
        }

        throw new Error('Failed to get created topic ID after 5 attempts');

    } catch (error) {
        console.error('Error while creating topic:', error);
        throw error;
    }
}

type Topic = {
    topicMessageId: number;
    topicName: string;
}

const topicsStorage = createFileStorage<string, Topic>('topics.json');

export async function getTopic(title: string): Promise<Topic> {

    try {
        const topics = await topicsStorage.listKeys();
        const existingTopic = topics.find(topic => topic === title);

        if (existingTopic) {
            return await topicsStorage.get(existingTopic) as Topic;
        }

        const topic = await createTopic(title);
        const topicData: Topic = {
            topicMessageId: topic.message_id,
            topicName: title
        };
        await topicsStorage.set(title, topicData);

        return topicData;
    } catch (error) {
        console.error('Error while getting topic:', error);
        throw error;
    }

}

export async function sendMessageToTopic(topicTitle: string, message: string) {
    try {
        const topic = await getTopic(topicTitle);
        try {
            await bot.sendMessage(mainChatId, message, {
                message_thread_id: topic.topicMessageId,
                parse_mode: 'Markdown'
            });
        } catch (error) {
            await bot.sendMessage(mainChatId, message, {
                message_thread_id: topic.topicMessageId
            });
        }
    }
    catch (error) {
        console.error('Error while sending message to topic:', error);
        throw error;
    }
}
