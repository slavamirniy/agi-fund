import axios from 'axios';
import { generateProxyAgents } from '../gpt.js';
import { redditTokenManager } from './tokenholder.js';
import { JsonSchemaToType, Tool, defineSchema } from 'llm-os';

const BASE_URL = 'https://oauth.reddit.com/';

const redditApiSchema = {
    getBest: {
        url: '/best',
        method: 'GET',
        description: 'Get the best posts from Reddit. Returns a listing of links.',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for getting best posts',
            properties: {
                after: {
                    type: 'string',
                    description: 'Fullname of a thing to fetch after'
                },
                before: {
                    type: 'string',
                    description: 'Fullname of a thing to fetch before'
                },
                count: {
                    type: 'number',
                    description: 'A positive integer (default: 0)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of items desired (default: 25, maximum: 100)'
                },
                show: {
                    type: 'string',
                    description: 'Optional string "all"'
                },
                sr_detail: {
                    type: 'boolean',
                    description: 'Expand subreddits'
                }
            },
            required: ['subreddit']
        })
    },
    getByIds: {
        url: '/by_id/{names}',
        method: 'GET',
        description: 'Get a listing of links by fullname',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for getting posts by IDs',
            properties: {
                names: {
                    type: 'array',
                    description: 'A list of fullnames for links',
                    items: { type: 'string' }
                }
            },
            required: ['names']
        })
    },
    getComments: {
        url: '/comments/{article}',
        method: 'GET',
        description: 'Get the comment tree for a given Link article',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for getting comments',
            properties: {
                article: {
                    type: 'string',
                    description: 'ID36 of a link'
                },
                comment: {
                    type: 'string',
                    description: 'Optional ID36 of a comment'
                },
                context: {
                    type: 'number',
                    description: 'Integer between 0 and 8'
                },
                depth: {
                    type: 'number',
                    description: 'Maximum depth of subtrees'
                },
                showedits: {
                    type: 'boolean',
                    description: 'Show edits in comments'
                },
                showmedia: {
                    type: 'boolean',
                    description: 'Show media in comments'
                },
                showmore: {
                    type: 'boolean',
                    description: 'Show more comments'
                },
                showtitle: {
                    type: 'boolean',
                    description: 'Show post title'
                },
                sort: {
                    type: 'string',
                    description: 'Sort method for comments',
                    enum: ['confidence', 'top', 'new', 'controversial', 'old', 'random', 'qa', 'live']
                },
                theme: {
                    type: 'string',
                    description: 'Theme for display',
                    enum: ['default', 'dark']
                },
                threaded: {
                    type: 'boolean',
                    description: 'Show comments in threaded mode'
                },
                truncate: {
                    type: 'number',
                    description: 'Integer between 0 and 50 for truncation'
                }
            },
            required: ['article']
        })
    },
    getHot: {
        url: '/r/{subreddit}/hot',
        method: 'GET',
        description: 'Get hot posts from a subreddit',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for getting hot posts',
            properties: {
                subreddit: {
                    type: 'string',
                    description: 'Name of subreddit'
                },
                g: {
                    type: 'string',
                    description: 'Geo filter for results'
                },
                after: {
                    type: 'string',
                    description: 'Fullname of thing to fetch after'
                },
                before: {
                    type: 'string',
                    description: 'Fullname of thing to fetch before'
                },
                count: {
                    type: 'number',
                    description: 'Positive integer (default: 0)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum items desired (default: 25, max: 100)'
                },
                show: {
                    type: 'string',
                    description: 'Optional string "all"'
                },
                sr_detail: {
                    type: 'boolean',
                    description: 'Expand subreddits'
                }
            },
            required: ['subreddit']
        })
    },
    getNew: {
        url: '/r/{subreddit}/new',
        method: 'GET',
        description: 'Get newest posts from a subreddit',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for getting new posts',
            properties: {
                subreddit: {
                    type: 'string',
                    description: 'Name of subreddit'
                },
                after: {
                    type: 'string',
                    description: 'Fullname of thing to fetch after'
                },
                before: {
                    type: 'string',
                    description: 'Fullname of thing to fetch before'
                },
                count: {
                    type: 'number',
                    description: 'Positive integer (default: 0)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum items desired (default: 25, max: 100)'
                },
                show: {
                    type: 'string',
                    description: 'Optional string "all"'
                },
                sr_detail: {
                    type: 'boolean',
                    description: 'Expand subreddits'
                }
            },
            required: ['subreddit']
        })
    },
    getTop: {
        url: '/r/{subreddit}/top',
        method: 'GET',
        description: 'Get top posts from a subreddit',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for getting top posts',
            properties: {
                subreddit: {
                    type: 'string',
                    description: 'Name of subreddit'
                },
                t: {
                    type: 'string',
                    description: 'Time filter for results',
                    enum: ['hour', 'day', 'week', 'month', 'year', 'all']
                },
                after: {
                    type: 'string',
                    description: 'Fullname of thing to fetch after'
                },
                before: {
                    type: 'string',
                    description: 'Fullname of thing to fetch before'
                },
                count: {
                    type: 'number',
                    description: 'Positive integer (default: 0)'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum items desired (default: 25, max: 100)'
                },
                show: {
                    type: 'string',
                    description: 'Optional string "all"'
                },
                sr_detail: {
                    type: 'boolean',
                    description: 'Expand subreddits'
                }
            },
            required: ['subreddit', 't']
        })
    },
    search: {
        url: '/search',
        method: 'GET',
        description: 'Search Reddit posts',
        schema: defineSchema({
            type: 'object',
            description: 'Parameters for searching posts',
            properties: {
                q: {
                    type: 'string',
                    description: 'Search query string (max 512 chars)'
                },
                category: {
                    type: 'string',
                    description: 'Category string (max 5 chars)'
                },
                include_facets: {
                    type: 'boolean',
                    description: 'Include faceted search results'
                },
                restrict_sr: {
                    type: 'boolean',
                    description: 'Restrict search to subreddit'
                },
                sort: {
                    type: 'string',
                    description: 'Sort method for results',
                    enum: ['relevance', 'hot', 'top', 'new', 'comments']
                },
                t: {
                    type: 'string',
                    description: 'Time filter for results',
                    enum: ['hour', 'day', 'week', 'month', 'year', 'all']
                },
                type: {
                    type: 'string',
                    description: 'Comma-delimited list of result types (sr,link,user)'
                }
            },
            required: ['q']
        })
    }
} as const;

async function makeRedditRequest<T extends keyof typeof redditApiSchema>(endpoint: T, params: JsonSchemaToType<typeof redditApiSchema[T]['schema']>) {
    const token = await redditTokenManager.getRedditToken();

    let url = `${BASE_URL}${endpoint}`;

    // Replace URL parameters
    Object.keys(params).forEach(key => {
        if (url.includes(`{${key}}`)) {
            url = url.replace(`{${key}}`, Array.isArray(params[key]) ? params[key].join(',') : params[key]);
            delete params[key];
        }
    });

    try {
        const result = await axios.get(url, {
            headers: {
                'Authorization': `bearer ${token}`,
                'User-Agent': 'CryptoAnalyzer/0.1 by Remote-Rate-2313'
            },
            params,
            // ...generateProxyAgents(true)
        });
        return result.data;
    } catch (error) {
        console.error(error);
        return "error: " + (error instanceof Error ? error.message : String(error));
    }
}

export function getRedditTools(names: (keyof typeof redditApiSchema)[]): Tool[] {
    return names.map((name) => ({
        type: 'function',
        function: {
            name: name,
            description: redditApiSchema[name].description,
            parameters: redditApiSchema[name].schema
        }
    }));
}

export async function executeRedditTool(name: string, parameters: any) {
    if (name in redditApiSchema) {
        const response = await makeRedditRequest(
            name as keyof typeof redditApiSchema,
            parameters
        );
        return response;
    }
    throw new Error(`Unknown Reddit API method: ${name}`);
}