import { AddonBuilder } from "llm-os";
import { chatBuilder, chats, emojies } from '../chat.js';
import { sendMessageToTopic } from '../../../utils/tgbot.js';

export const telegramAddon = AddonBuilder
    .start<ReturnType<typeof chatBuilder.build>>()
    .setState(() => { })
    .setFunctionsSchemasMiddleware((functions, state, appState) => functions)
    .setWindowMiddleware((window, state, appState) => window)
    .setButtonPressHandlerMiddleware((data) => {
        if (data.function.name === 'sendMessage') {
            const state = data.appState.get();
            if (!state.userId || !state.opennedChatId) return;
            const chat = chats.find(c => c.members.includes(state.userId!) && c.members.includes(state.opennedChatId!));
            if (!chat) return;
            try {
                sendMessageToTopic("" + chat.members.join(" | "), "FROM: " + (state.userId! in emojies ? emojies[state.userId!] : "") + " " + state.userId + "\n" + data.function.args.message);
            } catch (error) {
                console.error(error);
            }
        }
    })
    .setBasePromptMiddleware((prompt, state, appState) => prompt)
    .setAppDescriptionMiddleware((appDescription) => appDescription)
