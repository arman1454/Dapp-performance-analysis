const TronWeb = require('tronweb');
const fs = require('fs');
const contractAbi = require('./TronABI.json');

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
const numberOfTransactions = 10;

// Log results to a file
const logFile = 'tron_performance_logs.txt';

async function sendTransaction(val, isComplex) {
    try {
        // Start time before sending the transaction
        const startTime = Date.now();

        // Send transaction
        let tx;
        if (isComplex) {
            tx = await contract.methods.setComplexVal(val).send(); // Complex function
        } else {
            tx = await contract.methods.setVal(val).send(); // Simple function
        }
        console.log(`Transaction sent (${isComplex ? 'Complex' : 'Simple'}):`, tx);

        // End time after the transaction is sent
        const endTime = Date.now();

        // Calculate latency in seconds
        const latency = (endTime - startTime) / 1000;
        console.log(`Transaction confirmed (${isComplex ? 'Complex' : 'Simple'}): ${tx}, Latency: ${latency}s`);

        // Log the latency result to the file
        fs.appendFileSync(logFile, `Transaction confirmed (${isComplex ? 'Complex' : 'Simple'}): ${tx}, Latency: ${latency}s\n`);

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

async function measureThroughput(isComplex) {
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
        console.log(`Throughput (TPS) (${isComplex ? 'Complex' : 'Simple'}): ${tps}`);

        // Log TPS to file
        fs.appendFileSync(logFile, `Throughput (TPS) (${isComplex ? 'Complex' : 'Simple'}): ${tps}\n`);
    } catch (error) {
        console.error("Error measuring throughput:", error);
    }
}

async function main() {
    const latenciesSimple = [];
    const latenciesComplex = [];
    const interval = measurementPeriod * 1000 / numberOfTransactions;
    let value = 11;

    let totalLatencySimple = 0;
    let totalLatencyComplex = 0;

    // Simple transactions first
    const sendAndMeasureSimple = async () => {
        for (let i = 0; i < numberOfTransactions; i++) {
            const latency = await sendTransaction(value, false);
            if (latency !== null) {
                totalLatencySimple += latency;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
            value++;
        }
        if (totalLatencySimple > 0) {
            measureLatency(totalLatencySimple, numberOfTransactions);
        }
    };

    // Complex transactions
    const sendAndMeasureComplex = async () => {
        for (let i = 0; i < numberOfTransactions; i++) {
            const latency = await sendTransaction(value, true);
            if (latency !== null) {
                totalLatencyComplex += latency;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
            value++;
        }
        if (totalLatencyComplex > 0) {
            measureLatency(totalLatencyComplex, numberOfTransactions);
        }
    };

    // Run the transactions and TPS measurement concurrently for both simple and complex scenarios
    await Promise.all([sendAndMeasureSimple(), measureThroughput(false)]);
    await Promise.all([sendAndMeasureComplex(), measureThroughput(true)]);
}

main().catch(console.error);
