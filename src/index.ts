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
    const chatnames = ["CMO", "CTO", "CEO"];

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
        CMO: makeAgent("CMO", "Пообщайся с CEO." + CMO.system_prompt),
        CTO: makeAgent("CTO", "Пообщайся с CEO. " + CTO.system_prompt),
        CEO: makeAgent("CEO", "Пообщайся с CTO и CEO. Обсудите возможности ИИ для заработка." + CEO.system_prompt),
    }

    for (let i = 0; i < 30; i++) {
        for (const agent in agents) {
            await agents[agent as keyof typeof agents].act();
            await agents[agent as keyof typeof agents].act();
        }
    }
}

main();