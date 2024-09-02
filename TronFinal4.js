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
const numberOfTransactions = 1;
const logFile = 'Tron_logs_individual.txt';
const tpsAndLatencyLog = 'Tron_TPS&AvgLatency_log.txt';
const WalletResourceUsage = 'WalletResourceUsage.txt';




async function getEnergyAndTRXBalance(tronWeb) {
    try {
        const address = tronWeb.defaultAddress.base58;

        // Fetch account resources to get energy
        const accountResources = await tronWeb.trx.getAccountResources(address);
        const energy = accountResources.EnergyLimit - (accountResources.EnergyUsed || 0);
        const bandwidth = accountResources.freeNetLimit - (accountResources.freeNetUsed || 0);

        // Fetch TRX balance
        const trxBalance = await tronWeb.trx.getBalance(address);
        const trxBalanceInTRX = trxBalance / 1e6; // Convert from sun to TRX

        return { energy,bandwidth, trxBalance: trxBalanceInTRX };
    } catch (error) {
        console.error('Error fetching energy and TRX balance:', error);
        return { energy: 0, trxBalance: 0 };
    }
}

// Function to fetch transaction information using the transaction hash
async function fetchTransactionInfo(tronWeb, transactionID) {
    try {
        const transaction = await tronWeb.trx.getTransactionInfo(transactionID);
        const energyUsed = transaction.receipt.energy_usage_total || 0;
        const trxUsed = (transaction.fee || 0) / 1e6; // Convert from sun to TRX
        const bandwidthUsed = (transaction.net_fee||0)/1e3
        return { energyUsed, bandwidthUsed, trxUsed };
    } catch (error) {
        console.error('Error fetching transaction info:', error);
        return { energyUsed: 0, trxUsed: 0 };
    }
}

async function WalletResourceConsumption(walletName,txIds,tronWeb) {
    const initialBalances = await getEnergyAndTRXBalance(tronWeb);
    let currentBalance = initialBalances.trxBalance;
    console.log(`${walletName} Initial Balances - Energy: ${initialBalances.energy}, TRX: ${initialBalances.trxBalance}`);
    fs.appendFileSync(WalletResourceUsage, `${walletName} Initial Balances - Energy: ${initialBalances.energy}, TRX: ${initialBalances.trxBalance}\n`);
    for (let i = 0; i < txIds.length; i++) {
        const transactionInfo = await fetchTransactionInfo(tronWeb, txIds[i]);
        currentBalance = currentBalance - transactionInfo.trxUsed;
        console.log(`Transaction ${i + 1}: TRX Used: ${transactionInfo.trxUsed}, Energy Used: ${transactionInfo.energyUsed}, Balance: ${currentBalance}`);
        fs.appendFileSync(WalletResourceUsage, `Transaction ${i + 1}: TRX Used: ${transactionInfo.trxUsed}, Energy Used: ${transactionInfo.energyUsed}, Balance: ${currentBalance}\n`);
    }
}

async function sendTransaction(contract, val, walletName) {
    try {
        const startTime = Date.now();

        const tx = await contract.methods.setval(val).send();
        console.log(`Transaction sent from ${walletName}:`, tx);

        const endTime = Date.now();
        const latency = (endTime - startTime) / 1000;
        console.log(`Transaction confirmed from ${walletName}: ${tx}, Latency: ${latency}s`);

        fs.appendFileSync(logFile, `Transaction confirmed from ${walletName}: ${tx}, Latency: ${latency}s\n`);

        return {latency,tx};
    } catch (error) {
        console.error(`Error executing transaction from ${walletName}:`, error);
        return null;
    }
}

function measureLatency(totalLatency, numOfTransactions, walletName) {
    const averageLatency = totalLatency / numOfTransactions;
    console.log(`Average Latency for ${walletName}: ${averageLatency}s`);
    fs.appendFileSync(tpsAndLatencyLog, `Average Latency for ${walletName}: ${averageLatency}s\n`);
}

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

// { tronWeb: tronWebA, contract: contractInstanceA, name: 'Wallet A (Energy-Paying)',txIds:[] },
async function main() {
    const wallets = [
        { tronWeb: tronWebB, contract: contractInstanceB, name: 'Wallet B (TRX-Paying)',txIds:[] },
        { tronWeb: tronWebA, contract: contractInstanceA, name: 'Wallet A (Energy-Paying)', txIds: [] }
    ];

    for (const wallet of wallets) {
        fs.appendFileSync(logFile, `\nTesting transactions from ${wallet.name}\n`);
        let totalLatency = 0;

        // Parallel execution for sending transactions and measuring TPS
        const sendAndMeasure = async () => {
            let value = 44;
            for (let i = 0; i < numberOfTransactions; i++) {
                const {latency,tx} = await sendTransaction(wallet.contract, value, wallet.name);
                if (latency !== null) {
                    totalLatency += latency;
                }
                wallet.txIds.push(tx)
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second interval between transactions
                value++;
            }
            if (totalLatency > 0) {
                measureLatency(totalLatency, numberOfTransactions, wallet.name);
            }
        };

        // Run the transactions and TPS measurement concurrently
        await Promise.all([sendAndMeasure(), measureThroughput(wallet.tronWeb, wallet.name)]);
    }
    await new Promise(resolve => setTimeout(resolve, 80000))
    for (const wallet of wallets) {
        await WalletResourceConsumption(wallet.name,wallet.txIds,wallet.tronWeb)
        
    }




}

main().catch(console.error);
