import { AddonBuilder } from "llm-os";
import { OSAppBuilder } from "../../os/os.js";

export const reasoningAddon = AddonBuilder
    .start<ReturnType<typeof OSAppBuilder.build>>()
    .setState(() => ({
        log: [] as string[]
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
                                log: { type: 'string', description: 'If you understood something, write it in the log. If you did something, write it in the log.' },
                            },
                            required: [...func.parameters.required, 'log']
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
                        summary: { type: 'string', description: 'Summary of the log. Highlight all important points: what you did, what you learned, what you will do next. Сейчас мы удалим все логи и заменим их тем, что ты здесь напишешь. Оставь здесь важную информацию.' }
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

        if ("log" in data.function.args) {
            addonState.log.push("I called " + data.function.name + ". " + data.function.args.log);
        }

        if (data.function.name === 'summaryLogs') {
            addonState.log = [data.function.args.summary];
        }

        return addonState;

    })
    .setBasePromptMiddleware((prompt, addonState) => "WHEN SWITCHING BETWEEN APPLICATIONS - INFORMATION IS ERASED! WRITE ALL NECESSARY INFORMATION IN LOG AND MEMORY, OTHERWISE IT WILL BE DELETED (tasks, task results, thoughts, errors). If you understood something, write it in the log. If you did something, write it in the log. Below you have the LOG of previous actions. This is the most important thing you have. Rely on it. Don't repeat actions from there, think through new behavior strategies. " + prompt)
    .setAppDescriptionMiddleware(d => d)
