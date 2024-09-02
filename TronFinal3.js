const TronWeb = require('tronweb');
const fs = require('fs');
const contractAbi = require('./TronABI.json');
require('dotenv').config();

// Initialize TronWeb instances for both wallets
const tronWebA = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: process.env.Tron_WalletA_PrivateKey
});

const tronWebB = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: process.env.Tron_WalletB_PrivateKey
});

const contractAddress = 'TWLNxWm6CKHTPgtpzjaJrhpcSbxdg7uWBW';
const contractInstanceA = tronWebA.contract(contractAbi, contractAddress);
const contractInstanceB = tronWebB.contract(contractAbi, contractAddress);

const measurementPeriod = 60;
const numberOfTransactions = 3;
const logFile = 'Tron_logs_individual.txt';
const tpsAndLatencyLog = 'Tron_TPS&AvgLatency_log.txt';

// Function to fetch energy and TRX balance
async function getEnergyAndTRXBalance(tronWeb) {
    try {
        const address = tronWeb.defaultAddress.base58;

        // Fetch account resources to get energy
        const accountResources = await tronWeb.trx.getAccountResources(address);
        const energy = accountResources.energy_used || 0;

        // Fetch TRX balance
        const trxBalance = await tronWeb.trx.getBalance(address);
        const trxBalanceInTRX = trxBalance / 1e6; // Convert from sun to TRX

        return { energy, trxBalance: trxBalanceInTRX };
    } catch (error) {
        console.error('Error fetching energy and TRX balance:', error);
        return { energy: 0, trxBalance: 0 };
    }
}

// Function to fetch transaction information using the transaction hash
async function fetchTransactionInfo(tronWeb, transactionID) {
    try {
        await new Promise(resolve => setTimeout(resolve, 80000))
        const transaction = await tronWeb.trx.getTransactionInfo(transactionID);
        const energyUsed = transaction.receipt.energy_usage_total || 0;
        const trxUsed = (transaction.receipt.net_usage || 0) / 1e6; // Convert from sun to TRX

        return { energyUsed, trxUsed };
    } catch (error) {
        console.error('Error fetching transaction info:', error);
        return { energyUsed: 0, trxUsed: 0 };
    }
}

// Function to send a transaction
async function sendTransaction(contract, val, walletName) {
    try {
        const startTime = Date.now();

        const tx = await contract.methods.setval(val).send();
        console.log(`Transaction sent from ${walletName}:`, tx);

        const endTime = Date.now();
        const latency = (endTime - startTime) / 1000;
        console.log(`Transaction confirmed from ${walletName}: ${tx}, Latency: ${latency}s`);

        fs.appendFileSync(logFile, `Transaction confirmed from ${walletName}: ${tx}, Latency: ${latency}s\n`);

        return { latency, transactionID: tx };
    } catch (error) {
        console.error(`Error executing transaction from ${walletName}:`, error);
        return { latency: null, transactionID: null };
    }
}

// Function to measure latency
function measureLatency(totalLatency, numOfTransactions, walletName) {
    const averageLatency = totalLatency / numOfTransactions;
    console.log(`Average Latency for ${walletName}: ${averageLatency}s`);
    fs.appendFileSync(tpsAndLatencyLog, `Average Latency for ${walletName}: ${averageLatency}s\n`);
}

// Function to measure throughput
async function measureThroughput(tronWeb, walletName) {
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
        console.log(`Throughput (TPS) for ${walletName}: ${tps}`);
        fs.appendFileSync(tpsAndLatencyLog, `Throughput (TPS) for ${walletName}: ${tps}\n`);
    } catch (error) {
        console.error(`Error measuring throughput for ${walletName}:`, error);
    }
}

// Function to monitor energy and TRX usage
async function monitorEnergyAndTRXUsage(wallet, initialBalances) {
    const trxUsageRates = [];
    let previousTRXBalance = initialBalances.trxBalance;
    let totalLatency = 0;

    for (let i = 0; i < numberOfTransactions; i++) {
        const { latency, transactionID } = await sendTransaction(wallet.contract, i + 16, wallet.name);

        if (latency !== null) {
            totalLatency += latency;

            // Fetch transaction details from the transaction ID
            const transactionInfo = await fetchTransactionInfo(wallet.tronWeb, transactionID);

            const trxUsed = previousTRXBalance - transactionInfo.trxUsed;
            trxUsageRates.push(trxUsed);

            console.log(`Transaction ${i + 1}: TRX Used: ${trxUsed}, Energy Used: ${transactionInfo.energyUsed}`);
            fs.appendFileSync(logFile, `Transaction ${i + 1}: TRX Used: ${trxUsed}, Energy Used: ${transactionInfo.energyUsed}\n`);

            previousTRXBalance = previousTRXBalance - transactionInfo.trxUsed;
        }
    }

    // Measure average latency
    if (totalLatency > 0) {
        measureLatency(totalLatency, numberOfTransactions, wallet.name);
    }

    // Log the TRX usage rate increase
    for (let i = 1; i < trxUsageRates.length; i++) {
        const rateIncrease = trxUsageRates[i] - trxUsageRates[i - 1];
        console.log(`Rate of TRX Usage Increase from Transaction ${i} to ${i + 1}: ${rateIncrease}`);
        fs.appendFileSync(logFile, `Rate of TRX Usage Increase from Transaction ${i} to ${i + 1}: ${rateIncrease}\n`);
    }
}

// { tronWeb: tronWebA, contract: contractInstanceA, name: 'Wallet A (Energy-Paying)' },
// Main function
async function main() {
    const wallets = [
        { tronWeb: tronWebB, contract: contractInstanceB, name: 'Wallet B (TRX-Paying)' },
    ];

    for (const wallet of wallets) {
        fs.appendFileSync(logFile, `\nTesting transactions from ${wallet.name}\n`);
        const initialBalances = await getEnergyAndTRXBalance(wallet.tronWeb);

        console.log(`${wallet.name} Initial Balances - Energy: ${initialBalances.energy}, TRX: ${initialBalances.trxBalance}`);
        fs.appendFileSync(logFile, `${wallet.name} Initial Balances - Energy: ${initialBalances.energy}, TRX: ${initialBalances.trxBalance}\n`);

        // Monitor energy depletion and TRX usage
        await Promise.all([monitorEnergyAndTRXUsage(wallet, initialBalances), measureThroughput(wallet.tronWeb, wallet.name)]);
    }
}

main().catch(console.error);
