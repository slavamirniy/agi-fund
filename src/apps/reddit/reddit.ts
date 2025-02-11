import { executeRedditTool, getRedditTools } from '../../utils/reddit/api.js';
import { AppBuilder } from 'llm-os';

const redditTools = ['search', 'getBest', 'getHot', 'getNew'];
const tools = getRedditTools(redditTools as any[]);

export const redditApp = AppBuilder
    .start()
    .setState(() => ({
        lastData: "" as string,
        gpt: ((p: string) => p) as unknown as (prompt: string) => Promise<string>
    }))
    .setFunctionsSchemasGenerator(c => {
        for (const tool of tools) {
            c.add(tool.function.name, tool.function.description, {
                ...tool.function.parameters,
                properties: {
                    ...tool.function.parameters.properties,
                    goalOfSearch: {
                        type: "string",
                        description: "GPT will summarize data with this goal"
                    }
                },
                required: [...tool.function.parameters.required, "goalOfSearch"]
            });
        }
        return c;
    })
    .setWindowGenerator((state, generate) => {
        return {
            messages: [{
                role: 'system',
                content: "This is a Reddit app terminal. You can search for posts, get the best posts, get hot posts, and get new posts."
            }, ...(state.lastData.length > 0 ? [{
                role: 'system',
                content: state.lastData
            }] : [])],
            availableFunctions: tools.map(t => t.function.name) as never[],
        }
    })
    .setButtonPressHandler(async (data) => {
        const currentState = data.state.get();
        if (!redditTools.includes(data.function.name)) {
            if (data.function.name === "summarizeResults") {
                currentState.lastData = "Summarized results: " + data.function.args.summarization;
            }
            return currentState;
        }

        const { goalOfSearch, log, ...args } = data.function.args;
        const responseResult = await executeRedditTool(data.function.name, args);
        const summarizeResult = await currentState.gpt("Summarize the results of the " + data.function.name + " tool with the goal of " + goalOfSearch + "\n" + JSON.stringify(responseResult));
        currentState.lastData = "Summarized results: " + summarizeResult;
        return currentState;
    })
    .setBasePromptGenerator(state => "You are a Reddit expert. You can search for posts, get the best posts, get hot posts, and get new posts.")
    .setAppDescription("This is a Reddit app terminal. You can search for posts, get the best posts, get hot posts, and get new posts.")
