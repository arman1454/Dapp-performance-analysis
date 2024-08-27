const TronWeb = require('tronweb');
const fs = require('fs');
const contractAbi = require('./TronABI.json');

const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: '21BB2CD7F87A4C6ADE94215D9452A051F76B9DF2276865061FB343F8524AAEB4'
});

const contractAddress = 'TWLNxWm6CKHTPgtpzjaJrhpcSbxdg7uWBW';
const contract = tronWeb.contract(contractAbi, contractAddress);

const measurementPeriod = 60;
const numberOfTransactions = 5;
const logFile = 'Tron_logs.txt';

async function sendTransaction(val, energyLimit) {
    try {
        const startTime = Date.now();

        const tx = await contract.methods.setval(val).send({
            feeLimit: energyLimit * 10 ** 6,
        });
        console.log(`Transaction sent with Energy limit ${energyLimit}:`, tx);

        const endTime = Date.now();
        const latency = (endTime - startTime) / 1000;
        console.log(`Transaction confirmed: ${tx}, Latency: ${latency}s`);

        fs.appendFileSync(logFile, `Transaction confirmed with Energy limit ${energyLimit}: ${tx}, Latency: ${latency}s\n`);

        return latency;
    } catch (error) {
        console.error("Error executing function:", error);
        return null;
    }
}

function measureLatency(totalLatency, numOfTransactions) {
    const averageLatency = totalLatency / numOfTransactions;
    console.log(`Average Latency: ${averageLatency}s`);
    fs.appendFileSync(logFile, `Average Latency: ${averageLatency}s\n`);
}

async function measureThroughput(energyLimit) {
    try {
        const startBlock = await tronWeb.trx.getCurrentBlock();
        const startBlockNum = startBlock.block_header.raw_data.number;

        await new Promise(resolve => setTimeout(resolve, measurementPeriod * 1000));

        const endBlock = await tronWeb.trx.getCurrentBlock();
        const endBlockNum = endBlock.block_header.raw_data.number;

        let transactionCount = 0;

        for (let i = startBlockNum; i <= endBlockNum; i++) {
            const block = await tronWeb.trx.getBlock(i);

            if (block.transactions && block.transactions.length > 0) {
                block.transactions.forEach(tx => {
                    if (tx.raw_data.contract[0].parameter.value.contract_address === tronWeb.address.toHex(contractAddress)) {
                        transactionCount++;
                    }
                });
            }
        }

        const tps = transactionCount / measurementPeriod;
        console.log(`Throughput (TPS) with Energy limit ${energyLimit}: ${tps}`);
        fs.appendFileSync(logFile, `Throughput (TPS) with Energy limit ${energyLimit}: ${tps}\n`);
    } catch (error) {
        console.error("Error measuring throughput:", error);
    }
}

async function main() {
    const interval = measurementPeriod * 1000 / numberOfTransactions;
    let value = 45;

    const energyLimits = [4000, 1000];

    for (const energyLimit of energyLimits) {
        fs.appendFileSync(logFile, `Testing with Energy limit: ${energyLimit}\n`);
        let totalLatency = 0;

        for (let i = 0; i < numberOfTransactions; i++) {
            const latency = await sendTransaction(value, energyLimit);
            if (latency !== null) {
                totalLatency += latency;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
            value++;
        }

        if (totalLatency > 0) {
            measureLatency(totalLatency, numberOfTransactions);
        }

        // Measure TPS after each set of transactions based on the energy limit
        await measureThroughput(energyLimit);
    }
}

main().catch(console.error);
