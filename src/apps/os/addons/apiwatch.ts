import { AddonBuilder, OSAppBuilder, WindowWithFunctions, WindowWithFunctionsNames } from "llm-os";
import express from "express";

const PORT = 3021;
const windowsStates: Record<string, { basePrompt: string, window: WindowWithFunctionsNames<any> }> = {};

export const apiwatchAddon = AddonBuilder
    .start<ReturnType<typeof OSAppBuilder.build>>()
    .setState(() => ({
        agentName: Math.random().toString(36).substring(2, 15)
    }))
    .setFunctionsSchemasMiddleware(funcs => funcs)
    .setWindowMiddleware((window, state) => {
        windowsStates[state.agentName] = { basePrompt: windowsStates[state.agentName]?.basePrompt || "", window: window };
        return window;
    })
    .setButtonPressHandlerMiddleware(data => 
        data.addonState.get()
    )
    .setBasePromptMiddleware((prompt, state) => {
        windowsStates[state.agentName] = windowsStates[state.agentName] || { basePrompt: "", window: { messages: [], availableFunctions: [] } };
        windowsStates[state.agentName].basePrompt = prompt;
        return prompt;
    })
    .setAppDescriptionMiddleware(description => description)


const app = express();

app.get("/agent/window/:agentName", (req, res) => {
    const agentName = req.params.agentName;
    if (!(agentName in windowsStates)) {
        res.status(404).send("Agent not found");
    }
    try {
        const result = {
            messages: [{ role: "system", content: windowsStates[agentName].basePrompt }, ...windowsStates[agentName].window.messages],
            availableFunctions: windowsStates[agentName].window.availableFunctions
        }
        res.json(result);
    } catch (error) {
        // console.error(error);
        res.status(404).send("Agent not found");
    }
});




app.get("/agent/list", (req, res) => {
    res.json(Object.keys(windowsStates));
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`API Watch addon is running on port ${PORT}`);
});

