import './utils/tgbot.js';
import { OSAppBuilder, AppExecutor } from 'llm-os';
import { chatBuilder } from './apps/chat/chat.js';
import { telegramAddon } from './apps/chat/addons/telegram.js';
import { notificationsAddon } from './apps/chat/addons/notifications.js';
import { makeGptRequest, makeGptRequestToolsAsSchema } from './utils/gpt.js'
import { AddonsCollector, App } from 'llm-os';
import { CTO, CEO, CMO } from './personas.js';
import { apiwatchAddon } from './apps/os/addons/apiwatch.js';
import { ReasonChain } from './utils/reasoning/reasoningchain.js';
import { reasoningAddon } from './apps/os/addons/reasoning.js';

async function main() {
    const chatnames = ["olga", "ivan", "anton"];

    const makeAgent = (userId: string, prompt: string) => {
        return new AppExecutor(
            makeGptRequestToolsAsSchema,
            AddonsCollector.from(
                OSAppBuilder.build({
                    goal: prompt,
                    apps: {
                        chat: AddonsCollector
                            .from(chatBuilder.build({
                                userId,
                                allowedChats: chatnames.filter(name => name !== userId)
                            }))
                            .use(telegramAddon)
                            .use(notificationsAddon)
                            .build() as App<any, any>
                    }
                })
            )
                .use(reasoningAddon)
                .use(apiwatchAddon.setInitState({ agentName: userId }))
                .build()
        );
    }
    const agents = {
        olga: makeAgent("olga", "You are olga. You know that krigun is a blue lamp for children. But you don't tell this to ivan, you can tell others. Your goal is to find out what surzun is."),
        ivan: makeAgent("ivan", "You are ivan. You know that bavdan is a box for Christmas tree decorations. But you don't tell this to anton, you can tell others. Your goal is to find out what krigun is."),
        anton: makeAgent("anton", "You are anton. You know that surzun is a type of winter hat. But you don't tell this to olga, you can tell others. Your goal is to find out what bavdan is."),
    }

    for (let i = 0; i < 30; i++) {
        for (const agent in agents) {
            await agents[agent as keyof typeof agents].act();
            await agents[agent as keyof typeof agents].act();
        }
    }
}

main();