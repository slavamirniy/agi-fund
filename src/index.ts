import './utils/tgbot.js';
import { AppExecutor } from 'llm-os';
import { chatBuilder } from './apps/chat/chat.js';
import { telegramAddon } from './apps/chat/addons/telegram.js';
import { notificationsAddon } from './apps/chat/addons/notifications.js';
import { generateProxyAgents, makeGptRequest, makeGptRequestToolsAsSchema } from './utils/gpt.js'
import { AddonsCollector, App } from 'llm-os';
import { CTO, CEO, CMO } from './personas.js';
import { apiwatchAddon } from './apps/os/addons/apiwatch.js';
import { reasoningAddon } from './apps/os/addons/reasoning.js';
import { cryptoApp } from './apps/crypto/crypto.js';
import { OSAppBuilder } from './apps/os/os.js';
import { redditApp } from './apps/reddit/reddit.js';

async function main() {
    const chatnames = ["Market Expert", "CEO", "CMO"];

    const agents = {
        "Market Expert": new AppExecutor(
            makeGptRequestToolsAsSchema,
            AddonsCollector.from(
                OSAppBuilder.build({
                    goal: "You are a market expert. You need to get tasks from CEO in chat and complete them.",
                    apps: {
                        chat: AddonsCollector
                            .from(chatBuilder.build({
                                userId: "Market Expert",
                                allowedChats: chatnames.filter(name => name !== "Market Expert")
                            }))
                            .use(telegramAddon)
                            .use(notificationsAddon)
                            .build() as App<any, any>,
                        market: cryptoApp.build() as App<any, any>
                    }
                })
            )
                .use(reasoningAddon)
                .use(apiwatchAddon.setInitState({ agentName: "Market Expert" }))
                .build()
        ),
        "CEO": new AppExecutor(
            makeGptRequestToolsAsSchema,
            AddonsCollector.from(OSAppBuilder.build({
                goal: "You are a CEO of the crypto company. You need to give tasks to your team in chat. Your first task is get info about top 20 cryptocurrencies. Then you need to get more social info about them from CMO.",
                apps: {
                    chat: AddonsCollector
                        .from(chatBuilder.build({
                            userId: "CEO",
                            allowedChats: chatnames.filter(name => name !== "CEO")
                        }))
                        .use(telegramAddon)
                        .use(notificationsAddon)
                        .build() as App<any, any>,
                }
            }))
                .use(reasoningAddon)
                .use(apiwatchAddon.setInitState({ agentName: "CEO" }))
                .build() as App<any, any>
        ),
        "CMO": new AppExecutor(
            makeGptRequestToolsAsSchema,
            AddonsCollector.from(OSAppBuilder.build({
                goal: "You are a CMO of the crypto company. You need to get tasks from CEO in chat and complete them.",
                apps: {
                    chat: AddonsCollector
                        .from(chatBuilder.build({
                            userId: "CMO",
                            allowedChats: chatnames.filter(name => name !== "CMO")
                        }))
                        .use(telegramAddon)
                        .use(notificationsAddon)
                        .build() as App<any, any>,
                    reddit: redditApp.build({
                        gpt: async (prompt: string) => {
                            const res = await makeGptRequest([{
                                role: 'system',
                                content: prompt
                            }], undefined)
                            return res.choices[0].message.content;
                        }
                    }) as App<any, any>
                }
            }))
                .use(reasoningAddon)
                .use(apiwatchAddon.setInitState({ agentName: "CMO" }))
                .build() as App<any, any>
        )
    }

    for (let i = 0; i < 30; i++) {
        for (const agent in agents) {
            await agents[agent as keyof typeof agents].act();
            await agents[agent as keyof typeof agents].act();
        }
    }
}

main();