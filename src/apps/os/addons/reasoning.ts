import { AddonBuilder, OSAppBuilder } from "llm-os";
import { ReasonChain, ReasoningStep } from "../../../utils/reasoning/reasoningchain.js";
import { prompt } from '../../../utils/reasoning/settings.js';
import { makeGptRequest } from "../../../utils/gpt.js";
import { chatBuilder } from "../../chat/chat.js";

export const reasoningAddon = AddonBuilder
    .start<ReturnType<typeof OSAppBuilder.build>>()
    .setState(() => ({
        isReasoningMode: false,
        reasonsInSession: 0,
        reasoningHistory: [] as ReasoningStep[]
    }))
    .setFunctionsSchemasMiddleware((functions) => {
        return {
            ...functions,
            reasoning: {
                name: "reasoning",
                description: "Make a step in reasoning",
                parameters:
                {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        content: { type: 'string' },
                        next_action: { type: 'string', enum: ['continue', 'reflect'] },
                        confidence: { type: 'number' }
                    },
                    required: ['title', 'content', 'next_action', 'confidence']
                }
            },
            gotoSystem1: {
                name: "gotoSystem1",
                description: "Go to System 1 and start working",
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            gotoSystem2: {
                name: "gotoSystem2",
                description: "Go to System 2 and start reflecting",
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }
        }
    })
    .setWindowMiddleware((window, addonState) => {
        if (addonState.isReasoningMode) {
            const isCanGoSystem1 = addonState.reasonsInSession > 2;
            return {
                availableFunctions: ['reasoning', ...(isCanGoSystem1 ? ['gotoSystem1'] : [])],
                messages: [
                    {
                        role: 'system',
                        content: prompt
                    },
                    ...addonState.reasoningHistory.map(v => ({
                        role: 'assistant',
                        content: `Step ${v.number}: ${v.title}\n${v.content}`
                    })),
                    ...window.messages]
            }
        }

        const lastReasoningSteps = addonState.reasoningHistory.slice(-3);

        return {
            availableFunctions: [...(window.availableFunctions as any[]), 'gotoSystem2'],
            messages: [
                ...lastReasoningSteps.map(v => ({
                    role: 'assistant',
                    content: `Step ${v.number}: ${v.title}\n${v.content}`
                })),
                ...window.messages
            ]
        }
    })
    .setButtonPressHandlerMiddleware((data) => {
        const addonState = data.addonState.get();
        if (data.function.name === 'gotoSystem2') {
            addonState.isReasoningMode = true;
            addonState.reasonsInSession = 0;
        }


        if (data.function.name === 'reasoning') {
            addonState.reasoningHistory.push(data.function.args);
            addonState.reasonsInSession++;
        }

        if (data.function.name === 'gotoSystem1') {
            addonState.isReasoningMode = false;
        }

        return addonState;
    })
    .setBasePromptMiddleware((prompt, addonState) =>
        "You are working in two modes. You have System 1 and System 2. You are currently in" +
        (addonState.isReasoningMode ? "System 1. Here you can work within the operating system and can also switch to System 2. Do this whenever you understand that you have finished your tasks or you have a new task."
            : "System 2. Here you can reflect on your work. The outcome of your reflections should be a decision about what to do next. After you've made a decision, switch to System 1 and execute your decision.")
        + prompt
    )
    .setAppDescriptionMiddleware(d => d)
