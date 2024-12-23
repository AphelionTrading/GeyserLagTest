import { Connection, PublicKey } from "@solana/web3.js";
import { config } from "process";
import dotenv from "dotenv";
import Client, {
    CommitmentLevel,
    SubscribeUpdate,
    SubscribeRequest,
} from "@triton-one/yellowstone-grpc";

let grpc_latest_slot: number; 

async function subscribeGRPC(client: Client): Promise<void> {
    async function connect() {
        try {
            // Subscribe for events
            const stream = await client.subscribe();
            // Create `error` / `end` handler
            const streamClosed = new Promise<void>((resolve, reject) => {
                stream.on("error", (error) => {
                    console.error("Stream error:", error);
                    reject(error);
                    stream.end();
                });
                stream.on("end", () => {
                    console.log("Stream ended, attempting to reconnect...");
                    resolve();
                });
                stream.on("close", () => {
                    console.log("Stream closed, attempting to reconnect...");
                    resolve();
                });
            });

            stream.on("data", async (data) => {
                const parsedData = SubscribeUpdate.fromJSON(data);

                // When slot updates, manage the sliding window of slots
                if (parsedData.slot) {
                    const newSlot = parseInt(parsedData.slot.slot);
                    grpc_latest_slot = newSlot;
                }

                if (parsedData.transaction) {
                    const slot: number = Number(parsedData.transaction.slot);
                    // Do something with the transaction
                }
            });

            // Create subscribe request based on provided arguments.
            const request: SubscribeRequest = {
                accounts: {},
                slots: {},
                transactions: {},
                transactionsStatus: {},
                entry: {},
                blocks: {},
                blocksMeta: {},
                commitment: CommitmentLevel.PROCESSED,
                accountsDataSlice: [],
                ping: undefined,
            };

            // Slot update subscription
            request.slots.client = {
                filterByCommitment: true,
            };

            // Transaction subscription
            request.transactions.market = {
                vote: false,
                accountInclude: [],
                accountExclude: [],
                accountRequired: [],
            };


            // Send subscribe request
            await new Promise<void>((resolve, reject) => {
                stream.write(request, (err: any) => {
                    if (err === null || err === undefined) {
                        resolve();
                    } else {
                        reject(err);
                    }
                });
            }).catch((reason) => {
                console.error("Failed to send subscribe request:", reason);
                throw reason;
            });

            await streamClosed;
        } catch (error) {
            console.error("Connection error:", error);
        }

        // Wait before attempting to reconnect
        console.log("Waiting 5 seconds before reconnecting...");
        await new Promise(resolve => setTimeout(resolve, 5_000));
        return connect(); // Recursively try to reconnect
    }
    // Start the initial connection
    return connect();
}

async function gRPCHealthCheck(connection: Connection): Promise<void> {
    while (true) {
        const rpc_latest_slot = await connection.getSlot('processed');
        if (grpc_latest_slot < rpc_latest_slot) {
        console.warn(`gRPC is behind RPC by ${rpc_latest_slot - grpc_latest_slot} slots`);
        } else {
            console.log('gRPC is healthy');
        }
        await new Promise(resolve => setTimeout(resolve, 5_000));
    }
}

async function main() {
    // Load .env file
    dotenv.config();

    if (!process.env.RPC_URL_PATH || !process.env.RPC_TOKEN) {
        throw new Error("Missing RPC_URL_PATH or RPC_TOKEN in environment variables");
    }

    let connection: Connection;
    connection = new Connection(process.env.RPC_URL_PATH + process.env.RPC_TOKEN);
   
    const grpc_client = new Client(process.env.RPC_URL_PATH, process.env.RPC_TOKEN, {
        "grpc.max_receive_message_length": 64 * 1024 * 1024, // 64MiB
    });
    subscribeGRPC(grpc_client).catch(console.error);
    gRPCHealthCheck(connection);

}
main().catch(console.error);
