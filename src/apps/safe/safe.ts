import { AppBuilder } from "llm-os";
import Safe, {
    PredictedSafeProps,
    SafeAccountConfig,
    SafeDeploymentConfig,
    EthSafeTransaction,
    SigningMethod
} from "@safe-global/protocol-kit";
import { sepolia } from 'viem/chains';
import SafeApiKit from '@safe-global/api-kit';

const AGENT_ADDRESS = process.env.SAFE_AGENT_ADDRESS;
const AGENT_PRIVATE_KEY = process.env.SAFE_AGENT_PRIVATE_KEY;
const HUMAN_SIGNER_ADDRESS = process.env.SAFE_HUMAN_SIGNER_ADDRESS;
const RPC_URL = sepolia.rpcUrls.default.http[0];

const safeAccountConfig: SafeAccountConfig = {
    owners: [AGENT_ADDRESS!, HUMAN_SIGNER_ADDRESS!],
    threshold: 2
};

const predictedSafe: PredictedSafeProps = {
    safeAccountConfig
};

export const safeAppBuilder = AppBuilder
    .start()
    .setState(() => ({
        safeAddress: undefined as string | undefined,
        protocolKit: undefined as Safe | undefined,
        transactionHistory: [] as EthSafeTransaction[],
        lastAction: undefined as string | undefined,
        lastData: undefined as string | undefined,
        balance: "0" as string,
        isDeployed: false as boolean,
        owners: [] as string[],
        threshold: 0 as number,
        pendingTransactions: [] as EthSafeTransaction[],
        executedTransactions: [] as EthSafeTransaction[],
        deploymentStatus: undefined as 'pending' | 'deployed' | 'failed' | undefined,
        error: undefined as string | undefined
    }))
    .setFunctionsSchemasGenerator(c => c
        .add("deploySafe", "Deploy new Safe smart account", {
            type: "object",
            properties: {},
            required: []
        })
        .add("getSafeInfo", "Get information about deployed Safe", {
            type: "object",
            properties: {},
            required: []
        })
        .add("createTransaction", "Create new transaction", {
            type: "object",
            properties: {
                to: { type: "string", description: "Recipient address" },
                value: { type: "string", description: "Amount in ETH" },
                data: { type: "string", description: "Transaction data (optional)" }
            },
            required: ["to", "value"]
        })
        .add("executeTransaction", "Execute pending transaction", {
            type: "object",
            properties: {
                transactionId: { type: "number", description: "ID of transaction to execute" }
            },
            required: ["transactionId"]
        })
        .add("getTransactions", "Get list of transactions", {
            type: "object",
            properties: {
                status: { type: "string", enum: ["pending", "executed", "all"], description: "Filter transactions by status" }
            },
            required: ["status"]
        })
        .add("getBalance", "Get Safe balance", {
            type: "object",
            properties: {},
            required: []
        })
        .add("getOwners", "Get list of Safe owners", {
            type: "object",
            properties: {},
            required: []
        })
        .add("getThreshold", "Get Safe threshold", {
            type: "object",
            properties: {},
            required: []
        })
    )
    .setWindowGenerator((state, generate) => {
        const messages: { role: string; content: string }[] = [];

        if (state.lastAction) {
            messages.push({
                role: 'system',
                content: `Last action: ${state.lastAction}`
            });
        }

        if (state.lastData) {
            messages.push({
                role: 'system',
                content: state.lastData
            });
        }

        messages.push({
            role: 'system',
            content: "Safe Smart Account Terminal\n" +
                "Available commands:\n" +
                "- deploySafe: Deploy new Safe smart account\n" +
                "- getSafeInfo: Get information about deployed Safe\n" +
                "- createTransaction: Create new transaction\n" +
                "- executeTransaction: Execute pending transaction\n" +
                "- getTransactions: Get list of transactions\n" +
                "- getBalance: Get Safe balance\n" +
                "- getOwners: Get list of Safe owners\n" +
                "- getThreshold: Get Safe threshold"
        });

        return {
            messages,
            availableFunctions: [
                "deploySafe",
                "getSafeInfo", 
                "createTransaction",
                "executeTransaction",
                "getTransactions",
                "getBalance",
                "getOwners",
                "getThreshold"
            ]
        };
    })
    .setButtonPressHandler(async (data) => {
        const currentState = data.state.get();
        currentState.lastAction = data.function.name;

        try {
            switch(data.function.name) {
                case "deploySafe":
                    const protocolKit = await Safe.init({
                        provider: RPC_URL,
                        predictedSafe
                    });
                    currentState.protocolKit = protocolKit;
                    const safeAddress = await protocolKit.getAddress();
                    currentState.safeAddress = safeAddress;
                    currentState.deploymentStatus = 'deployed';
                    currentState.lastData = `Safe deployed at ${safeAddress}`;
                    break;

                case "getSafeInfo":
                    if (!currentState.protocolKit) {
                        throw new Error("Safe not deployed");
                    }
                    const info = await currentState.protocolKit.getAddress();
                    currentState.lastData = `Safe address: ${info}`;
                    break;

                case "createTransaction":
                    if (!currentState.protocolKit) {
                        throw new Error("Safe not deployed");
                    }
                    const { to, value, data: txData } = data.function.args;
                    const safeTransactionData = {
                        to,
                        value,
                        data: txData || '0x'
                    };
                    const safeTransaction = await currentState.protocolKit.createTransaction({
                        transactions: [safeTransactionData]
                    });
                    const signedTx = await currentState.protocolKit.signTransaction(
                        safeTransaction,
                        SigningMethod.ETH_SIGN
                    );
                    currentState.pendingTransactions.push(signedTx);
                    currentState.lastData = `Transaction created and signed`;
                    break;

                case "executeTransaction":
                    if (!currentState.protocolKit) {
                        throw new Error("Safe not deployed");
                    }
                    const { transactionId } = data.function.args;
                    const pendingTx = currentState.pendingTransactions[transactionId];
                    if (!pendingTx) {
                        throw new Error("Transaction not found");
                    }
                    const executedTx = await currentState.protocolKit.executeTransaction(pendingTx);
                    currentState.executedTransactions.push(pendingTx);
                    currentState.pendingTransactions = currentState.pendingTransactions.filter((_, i) => i !== transactionId);
                    currentState.lastData = `Transaction executed: ${executedTx.hash}`;
                    break;

                case "getTransactions":
                    const { status } = data.function.args;
                    let transactions;
                    if (status === 'pending') {
                        transactions = currentState.pendingTransactions;
                    } else if (status === 'executed') {
                        transactions = currentState.executedTransactions;
                    } else {
                        transactions = [...currentState.pendingTransactions, ...currentState.executedTransactions];
                    }
                    currentState.lastData = `Transactions (${status}): ${JSON.stringify(transactions)}`;
                    break;

                case "getBalance":
                    if (!currentState.protocolKit) {
                        throw new Error("Safe not deployed");
                    }
                    const balance = await currentState.protocolKit.getBalance();
                    currentState.balance = balance.toString();
                    currentState.lastData = `Balance: ${balance} ETH`;
                    break;

                case "getOwners":
                    if (!currentState.protocolKit) {
                        throw new Error("Safe not deployed");
                    }
                    const owners = await currentState.protocolKit.getOwners();
                    currentState.owners = owners;
                    currentState.lastData = `Owners: ${owners.join(', ')}`;
                    break;

                case "getThreshold":
                    if (!currentState.protocolKit) {
                        throw new Error("Safe not deployed");
                    }
                    const threshold = await currentState.protocolKit.getThreshold();
                    currentState.threshold = threshold;
                    currentState.lastData = `Threshold: ${threshold}`;
                    break;
            }
        } catch (error) {
            currentState.error = error.message;
            currentState.lastData = `Error: ${error.message}`;
        }

        return currentState;
    })
    .setBasePromptGenerator(state => 
        "You are a Safe smart account expert. You can help users manage their Safe account, " +
        "create and execute transactions, and get information about the Safe status."
    )
    .setAppDescription(
        "This is a Safe smart account terminal application. It allows you to deploy and manage " +
        "a Safe smart account, create and execute multi-signature transactions, and monitor " +
        "the account status and transaction history."
    )