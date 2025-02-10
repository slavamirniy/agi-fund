import { AddonBuilder } from "llm-os";
import { chatBuilder, chats } from "../chat.js";

export const notificationsAddon = AddonBuilder
    .start<ReturnType<typeof chatBuilder.build>>()
    .setState(() => ({
        lastTotalMessages: {} as Record<string, number>
    }))
    .setFunctionsSchemasMiddleware((functions, state, appState) => functions)
    .setWindowMiddleware((window, state, appState) => {
        if (!appState.userId) return window;
        const totals = chats
            .filter(c => c.members.includes(appState.userId!))
            .map(v => ({
                chat: v.members.join(" | "),
                totalMessages: v.messages.filter(msg => msg.sender !== appState.userId).length
            }))
            .map(v => ({
                chat: v.chat,
                newMessages: v.totalMessages - (v.chat in state.lastTotalMessages ? state.lastTotalMessages[v.chat] : 0)
            }))
            .filter(v => v.newMessages > 0)
            .map(v => "You have " + v.newMessages + " new messages in the chat " + v.chat)
            .join("\n");
        return {
            ...window,
            messages: [
                ...window.messages,
                {
                    role: 'system',
                    content: totals
                }
            ]
        }

    })
    .setButtonPressHandlerMiddleware(d => {
        const appState = d.appState.get();
        const addonState = d.addonState.get();
        if (d.function.name === "sendMessage" || d.function.name === "openChat") {
            const chat = chats.find(c => c.members.includes(appState.userId!) && c.members.includes(appState.opennedChatId!));
            if (!chat) return addonState;
            const totalMessages = chat.messages.filter(msg => msg.sender !== appState.userId).length;
            addonState.lastTotalMessages[chat.members.join(" | ")] = totalMessages;
            return addonState;
        }
        return addonState;
    })
    .setBasePromptMiddleware((prompt, state, appState) => {
        if (!appState.userId) return prompt;
        const totals = chats
            .filter(c => c.members.includes(appState.userId!))
            .map(v => ({
                chat: v.members.join(" | "),
                totalMessages: v.messages.filter(msg => msg.sender !== appState.userId).length
            }))
            .map(v => ({
                chat: v.chat,
                newMessages: v.totalMessages - state.lastTotalMessages[v.chat]
            }))
            .filter(v => v.newMessages > 0)
            .map(v => "You have " + v.newMessages + " new messages in the chat " + v.chat)
            .join("\n");

        return prompt + "\n" + totals;
    })
    .setAppDescriptionMiddleware(appDescription => appDescription)
