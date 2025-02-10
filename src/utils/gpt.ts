import axios from "axios";
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { Tool } from "llm-os";
import { Ajv } from 'ajv';

let USE_PROXY = true;

const proxies = [
    process.env.PROXY_URL as string
];


export function unleaf() {
    return {
        httpsAgent: new HttpsAgent({ rejectUnauthorized: false }),
        httpAgent: new HttpAgent({})
    }
}

function parseProxyString(proxyString: string) {
    const [host, port, username, password] = proxyString.split(':');
    return {
        host: host,
        port: parseInt(port, 10),
        auth: {
            username: username,
            password: password
        }
    };
}

export function generateProxyAgents(force = false) {

    if (!USE_PROXY && !force) {
        return {};
    }

    const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];

    const p = parseProxyString(randomProxy);

    const preapred = "http://" + p.auth.username + ":" + p.auth.password + "@" + p.host + ":" + p.port;

    const httpsAgent = new HttpsProxyAgent(preapred);
    httpsAgent.options.rejectUnauthorized = false;
    const httpAgent = new HttpProxyAgent(preapred);
    httpAgent.options.rejectUnauthorized = false;
    const proxy = {
        httpsAgent,
        httpAgent
    }
    return proxy;
}

export async function makeGptRequest(messages: any[], tools: any[] | undefined, parallel_tool_calls: boolean = false, jsonSchema?: { type: 'object', properties: any } | undefined, abortController?: AbortController | undefined) {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: messages,
            ...(tools ? { tools: tools, parallel_tool_calls } : {}),
            ...(jsonSchema !== undefined ?
                {
                    response_format: {
                        type: 'json_schema',
                        json_schema: {
                            name: 'button_execute_schema',
                            schema: jsonSchema
                        }
                    }
                } : {})
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
            },
            ...generateProxyAgents(),
            signal: abortController?.signal // Добавляем сигнал прерывания
        }).then(response => response.data);

        return response;
    } catch (error) {
        console.error('Error generating prompt:', error);
        throw error;
    }
}

const ajv = new Ajv();

export async function makeGptRequestToolsAsSchema(messages: any[], tools: Tool[]) {
    const schema = {
        type: 'object',
        description: 'Нажать кнопку',
        oneOf: tools.map(tool => ({
            type: 'object',
            strict: true,
            properties: {
                name: { type: 'string', enum: [tool.function.name] },
                // description: { type: 'string', enum: [tool.function.description] },
                properties: { ...tool.function.parameters }
            },
            required: ['name', 'properties'],
            additionalProperties: false
        }))
    };

    const schemaForValidation = {
        type: 'object',
        description: 'Нажать кнопку',
        oneOf: tools.map(tool => ({
            type: 'object',
            properties: {
                name: { type: 'string', enum: [tool.function.name] },
                // description: { type: 'string', enum: [tool.function.description] },
                properties: { ...tool.function.parameters }
            },
            required: ['name', 'properties'],
            additionalProperties: false
        }))
    };

    const requestSchema = {
        type: 'object',
        properties: {
            tool_call: schema
        }
    } as const;

    const requestSchemaForValidation = {
        type: 'object',
        properties: {
            tool_call: schemaForValidation
        }
    } as const;

    const result = await makeGptRequest(messages, undefined, undefined, requestSchema);


    const parsed = JSON.parse(result.choices[0].message.content);

    if (!ajv.validate(requestSchemaForValidation, parsed)) {
        console.log("Tool call is invalid");
        return makeGptRequestToolsAsSchema(messages, tools);
    }
    console.log("Tool call is valid");

    return {
        tool_call: {
            name: parsed.tool_call.name,
            arguments: parsed.tool_call.properties
        }
    };

}