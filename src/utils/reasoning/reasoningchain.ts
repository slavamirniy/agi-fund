import { answerSchema, prompt as SYSTEM_PROMPT } from './settings.js'

export interface ReasoningStep {
    number: number;
    title: string;
    content: string;
    confidence: number;
    thinkingTime: number;
    // isFinal: boolean;
}

export class ReasoningError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ReasoningError';
    }
}

export class ReasonChain {
    private modelExecutor: (messages: any[], jsonSchema: any, temperature: number) => Promise<string>;
    private chatHistory: Array<{ role: string; content: string }>;
    private minSteps: number;
    private temperature: number;

    constructor(options: {
        modelExecutor: (messages: any[], jsonSchema: any) => Promise<string>;
        temperature?: number;
        minSteps?: number;
    }) {
        this.modelExecutor = options.modelExecutor;
        this.temperature = options.temperature || 0.2;
        this.minSteps = options.minSteps || 1;
        this.chatHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
    }

    async *generate(query: string): AsyncGenerator<ReasoningStep> {
        this.chatHistory.push({ role: 'user', content: query });
        let stepNumber = 1;

        while (true) {
            const startTime = Date.now();
            const response = await this.modelExecutor(this.chatHistory, answerSchema, this.temperature);
            const thinkingTime = Date.now() - startTime;

            const step = this.parseResponse(stepNumber, response, thinkingTime);
            this.chatHistory.push({
                role: 'assistant',
                content: `Step ${stepNumber}: ${step.content}`
            });

            yield step;

            // if (step.isFinal && stepNumber >= this.minSteps) break;
            stepNumber++;
        }
    }

    private parseResponse(
        stepNumber: number,
        response: string,
        thinkingTime: number
    ): ReasoningStep {
        try {
            const data = JSON.parse(response);
            return {
                number: stepNumber,
                title: data.title || `Step ${stepNumber}`,
                content: data.content,
                confidence: data.confidence || 0.8,
                thinkingTime,
                // isFinal: data.next_action === 'final_answer'
            };
        } catch (e) {
            throw new ReasoningError('Invalid response format from LLM');
        }
    }
}