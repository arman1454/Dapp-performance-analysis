const TronWeb = require('tronweb');
const fs = require('fs');
const contractAbi = require('./TronABI.json');
//Private Key: 21BB2CD7F87A4C6ADE94215D9452A051F76B9DF2276865061FB343F8524AAEB4
//const walletAddress = 'TRoYuUqeFKMJqrVrkVqy1tLn7HfxKUevEy';
// Set up TronWeb instance
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: '21BB2CD7F87A4C6ADE94215D9452A051F76B9DF2276865061FB343F8524AAEB4'
});

// Address of your smart contract on the Shasta test network
const contractAddress = 'TWLNxWm6CKHTPgtpzjaJrhpcSbxdg7uWBW';

// Create a contract instance
const contract = tronWeb.contract(contractAbi, contractAddress);

// Measurement period in seconds
const measurementPeriod = 60;

// Number of transactions to send
const numberOfTransactions = 1;

// Log results to a file
const logFile = 'Tron_logs.txt';

async function sendTransaction(val) {
    try {
        // Start time before sending the transaction
        const startTime = Date.now();

        // Send transaction
        const tx = await contract.methods.setval(val).send();
        console.log("Transaction sent:", tx);

        // End time after the transaction is sent
        const endTime = Date.now();

        // Calculate latency in seconds
        const latency = (endTime - startTime) / 1000;
        console.log(`Transaction confirmed: ${tx}, Latency: ${latency}s`);

        // Log the latency result to the file
        fs.appendFileSync(logFile, `Transaction confirmed: ${tx}, Latency: ${latency}s\n`);

        return latency;
    } catch (error) {
        console.error("Error executing function:", error);
        return null;
    }
}

function measureLatency(totalLatency, numOfTransactions) {
    const averageLatency = totalLatency / numOfTransactions;
    console.log(`Average Latency: ${averageLatency}s`);
    // Log average latency
    fs.appendFileSync(logFile, `Average Latency: ${averageLatency}s\n`);
}

async function measureThroughput() {
    try {
        // Get the current block number
        const startBlock = await tronWeb.trx.getCurrentBlock();
        const startBlockNum = startBlock.block_header.raw_data.number;

        // Wait for the measurement period
        await new Promise(resolve => setTimeout(resolve, measurementPeriod * 1000));

        // Get the block number after the measurement period
        const endBlock = await tronWeb.trx.getCurrentBlock();
        const endBlockNum = endBlock.block_header.raw_data.number;

        let transactionCount = 0;

        // Loop through blocks and count relevant transactions
        for (let i = startBlockNum; i <= endBlockNum; i++) {
            const block = await tronWeb.trx.getBlock(i);

            // Check if the block has transactions
            if (block.transactions && block.transactions.length > 0) {
                // Count transactions related to your dApp (contract)
                block.transactions.forEach(tx => {
                    if (tx.raw_data.contract[0].parameter.value.contract_address === tronWeb.address.toHex(contractAddress)) {
                        transactionCount++;
                    }
                });
            }
        }

        // Calculate TPS
        const tps = transactionCount / measurementPeriod;
        console.log(`Throughput (TPS): ${tps}`);

        // Log TPS to file
        fs.appendFileSync(logFile, `Throughput (TPS): ${tps}\n`);
    } catch (error) {
        console.error("Error measuring throughput:", error);
    }
}

async function main() {
    const latencies = [];
    const interval = measurementPeriod * 1000 / numberOfTransactions;
    let value = 45;

    let totalLatency = 0;

    const sendAndMeasure = async () => {
        for (let i = 0; i < numberOfTransactions; i++) {
            const latency = await sendTransaction(value);
            if (latency !== null) {
                totalLatency += latency;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
            value++;
        }
        if (totalLatency > 0) {
            measureLatency(totalLatency, numberOfTransactions);
        }
    };

    // Run the transactions and TPS measurement concurrently
    // await Promise.all([sendAndMeasure(), measureThroughput()]);
    await sendAndMeasure();
}

main().catch(console.error);
