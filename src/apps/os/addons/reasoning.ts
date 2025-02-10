import { AddonBuilder, OSAppBuilder } from "llm-os";
import { prompt } from '../../../utils/reasoning/settings.js';

export const reasoningAddon = AddonBuilder
    .start<ReturnType<typeof OSAppBuilder.build>>()
    .setState(() => ({
        log: [] as string[],
    }))

    .setFunctionsSchemasMiddleware((functions) => {
        return {
            ...Object.fromEntries(
                Object.entries(functions).map(([key, func]) => [
                    key,
                    {
                        ...func,
                        parameters: {
                            ...func.parameters,
                            properties: {
                                ...func.parameters.properties,
                                log: { type: 'string', description: 'If you understood something, write it in the log. If you did something, write it in the log.' }
                            }
                        }
                    }
                ])
            ),
            summaryLogs: {
                name: "summaryLogs",
                description: "Summarize the log",
                parameters: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string', description: 'Summary of the log. Highlight all important points: what you did, what you learned, what you will do next.' }
                    },
                    required: ['summary']
                }
            }
        }
    })


    .setWindowMiddleware((window, addonState) => {

        if (addonState.log.length > 10) {
            return {
                availableFunctions: ['summaryLogs'],
                messages: [
                    {
                        role: 'assistant',
                        content: "LOG:\n" + addonState.log.join("\n")
                    },
                    ...window.messages
                ]
            }
        }

        return {
            availableFunctions: [...(window.availableFunctions as any[])],
            messages: [
                {
                    role: 'assistant',
                    content: "LOG:\n" + addonState.log.join("\n")
                },
                ...window.messages
            ]


        }
    })
    .setButtonPressHandlerMiddleware((data) => {
        const addonState = data.addonState.get();

        addonState.log.push("I called " + data.function.name + ". " + data.function.args.log);

        if (data.function.name === 'summaryLogs') {
            addonState.log = [data.function.args.summary];
        }

        return addonState;

    })
    .setBasePromptMiddleware((prompt, addonState) => "If you understood something, write it in the log. If you did something, write it in the log. Ниже у тебя представлен LOG предыдущих действий. Это самое важное, что у тебя есть. Опирайся на него. Не повторяй действия оттуда, продумывай новые стратегии поведения. " + prompt)
    .setAppDescriptionMiddleware(d => d)
