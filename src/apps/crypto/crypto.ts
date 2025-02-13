import { AppBuilder } from "llm-os";
import axios from "axios";

export const cryptoApp = AppBuilder
    .start()
    .setState(() => ({
        sessionHistory: ["Welcome to CoinMarketCap terminal. What can I do for you today?"] as any[]
    }))
    .setFunctionsSchemasGenerator(c => c
        .add('getLatestListings', 'Returns a paginated list of all active cryptocurrencies with latest market data', {
            type: 'object',
            properties: {
                start: {
                    type: 'number',
                    minimum: 1,
                    description: 'Offset the start (1-based index) of the paginated list'
                },
                limit: {
                    type: 'number',
                    minimum: 1,
                    maximum: 5000,
                    description: 'Number of results to return'
                },
                price_min: {
                    type: 'number',
                    description: 'Minimum USD price threshold'
                },
                price_max: {
                    type: 'number',
                    description: 'Maximum USD price threshold'
                },
                market_cap_min: {
                    type: 'number',
                    description: 'Minimum market cap threshold'
                },
                market_cap_max: {
                    type: 'number',
                    description: 'Maximum market cap threshold'
                },
                volume_24h_min: {
                    type: 'number',
                    description: 'Minimum 24h USD volume threshold'
                },
                volume_24h_max: {
                    type: 'number',
                    description: 'Maximum 24h USD volume threshold'
                },
                sort: {
                    type: 'string',
                    enum: ['market_cap', 'name', 'symbol', 'date_added', 'price', 'circulating_supply', 'total_supply', 'max_supply', 'num_market_pairs', 'volume_24h', 'percent_change_1h', 'percent_change_24h', 'percent_change_7d'],
                    description: 'Field to sort cryptocurrencies by'
                },
                sort_dir: {
                    type: 'string',
                    enum: ['asc', 'desc'],
                    description: 'Sort direction'
                },
                convert: {
                    type: 'string',
                    description: 'Comma-separated list of conversion currencies'
                }
            },
            required: ['limit']
        })
    )
    .setWindowGenerator((state) => {
        return {
            availableFunctions: ['getLatestListings'],
            messages: state.sessionHistory.map(v => ({
                role: 'system',
                content: JSON.stringify(v)
            }))
        }
    })
    .setButtonPressHandler(async (data) => {
        const currentState = data.state.get();
        if (data.function.name === 'getLatestListings') {
            currentState.sessionHistory[1] = ("You called getLatestListings function with parameters: " + JSON.stringify(data.function.args) + ". Please wait...");
            const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=20', {
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMC_KEY,
                },
            })
            currentState.sessionHistory[1] = ("getLatestListings function returned: " + JSON.stringify(response.data));
        }
        return currentState;
    })
    .setBasePromptGenerator(state => "You have opened the Coin Market Cap terminal where you can get information about cryptocurrencies. You can use the getLatestListings function to get information about cryptocurrencies.")
    .setAppDescription("Coin Market Cap terminal")