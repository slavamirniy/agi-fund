import { AppBuilder } from "llm-os";
export const chats: {
    members: [string, string],
    messages: {
        sender: string,
        content: string
    }[]
}[] = [
        {
            members: ["Market Expert", "CEO"],
            messages: []
        },
        {
            members: ["CEO", "CMO"], 
            messages: []
        }
    ]

export const emojies: Record<string, string> = {
    "CEO": "👨‍💼",
    "CTO": "👨‍💻",
    "CMO": "👩‍💼",
    "CFO": "👩‍💼"
}

export const chatBuilder = AppBuilder

    .start()
    .setState(() => ({
        opennedChatId: undefined as string | undefined,
        userId: undefined as string | undefined,
        reasoning: "" as string,
        lastAction: undefined as string | undefined,
        allowedChats: [] as string[]

    }))
    .setFunctionsSchemasGenerator((v, state) => v
        .add("sendMessage", "Send message to chat", {
            type: "object",
            properties: {
                message: {
                    type: "string"
                }
            },
            required: ["message"]
        })
        .add("openChat", "Open chat with user", {
            type: "object",
            properties: {
                chatId: {
                    type: "string",
                    enum: state.allowedChats
                }
            },
            required: ["chatId"]
        })
        .add("openChatList", "Open chat list", {
            type: "object",
            properties: {
            },
            required: []
        })
    )
    .setWindowGenerator((state, generateWindow) => {
        const userId = state.userId;
        const additionalMessages = state.reasoning.length > 0 ? [{ content: "Your reasoning:\n" + state.reasoning, role: "system" }] : [];
        if (!userId) return {
            messages: [{ content: "You are not authorized", role: "system" }],
            availableFunctions: []
        };

        if (!state.opennedChatId) {
            const avaliableChats = chats.filter(chat => chat.members.includes(userId));
            const avaliableUsers = avaliableChats
                .map(chat => chat.members.find(member => member !== userId))
                .filter(user => user !== undefined);
            const avaliableUsersString = avaliableUsers.join(", ");

            return {
                messages: [...additionalMessages, { content: "List of available users to chat with:\n" + avaliableUsersString, role: "system" }],
                availableFunctions: ["openChat"]
            };
        }

        const chat = chats.find(chat => chat.members.includes(userId) && chat.members.includes(state.opennedChatId!));
        if (!chat) return generateWindow({
            ...state,
            opennedChatId: undefined
        });

        const messages = chat.messages
            .map(message => (message.sender === userId ?
                {
                    content: message.content,
                    role: "assistant"
                } :
                {
                    content: message.content,
                    role: "user"
                }
            ))


        const allowSendMessage = chat.messages.at(-1)?.sender !== state.userId;

        return {
            messages: [
                ...additionalMessages,
                {
                    content: "You have an open chat with " + state.opennedChatId,
                    role: "system"
                },
                ...messages,
                ...(!allowSendMessage ? [{ content: "SYSTEM MESSAGE: You cannot send a message until the user responds", role: "system" }] : [])
            ],
            availableFunctions: ["openChatList", ...(allowSendMessage ? ["sendMessage"] : [])] as ("openChatList" | "sendMessage")[]
        };
    })

    .setButtonPressHandler((data) => {
        const currentState = data.state.get();

        currentState.lastAction = data.function.name;

        if (data.function.name === "sendMessage") {
            if (!currentState.opennedChatId) {
                return currentState;
            }

            chats.find(chat => chat.members.includes(currentState.opennedChatId!) && chat.members.includes(data.state.get().userId!))!.messages.push({
                sender: currentState.userId!,
                content: data.function.args.message
            });

            return currentState;
        }

        if (data.function.name === "openChat") {
            currentState.opennedChatId = data.function.args.chatId;
        }

        if (data.function.name === "openChatList") {
            currentState.opennedChatId = undefined;
        }

        return currentState;
    })
    .setBasePromptGenerator(state =>
        state.opennedChatId !== undefined ?
            "You have an open chat with " + state.opennedChatId
            :
            ""
    )

    .setAppDescription("This is an application for communicating with users. You can open a chat with a user, send them messages and view the list of available users to chat with.")
