const TronWeb = require('tronweb');
const pidusage = require('pidusage');
const fs = require('fs');
require('dotenv').config();
const measurementPeriod = 60; // Measurement period in seconds
const logFile = 'Tron_logs_individual.txt';
const tpsAndLatencyLog = 'Tron_TPS&AvgLatency_log.txt';
const tronWalletResource = 'TronWalletResourceUsage.txt';
const resourceUsageLog = 'Tron_Resource_Usage.txt'; // New log for CPU/Memory usage

async function getEnergyAndTRXBalance(tronWeb) {
    try {
        const address = tronWeb.defaultAddress.base58;
        const accountResources = await tronWeb.trx.getAccountResources(address);
        const energy = (accountResources.EnergyLimit || 0) - (accountResources.EnergyUsed || 0);
        const bandwidth = accountResources.freeNetLimit - (accountResources.freeNetUsed || 0);
        const trxBalance = await tronWeb.trx.getBalance(address);
        const trxBalanceInTRX = trxBalance / 1e6; // Convert from sun to TRX

        return { energy, bandwidth, trxBalance: trxBalanceInTRX };
    } catch (error) {
        console.error('Error fetching energy and TRX balance:', error);
        return { energy: 0, trxBalance: 0 };
    }
}

// Fetch transaction info using the transaction hash
async function fetchTransactionInfo(tronWeb, transactionID) {
    try {
        const transaction = await tronWeb.trx.getTransactionInfo(transactionID);
        const energyUsed = transaction.receipt.energy_usage_total || 0;
        const trxUsed = (transaction.fee || 0) / 1e6; // Convert from sun to TRX
        const bandwidthUsed = (transaction.net_fee || 0) / 1e3;
        return { energyUsed, bandwidthUsed, trxUsed };
    } catch (error) {
        console.error('Error fetching transaction info:', error);
        return { energyUsed: 0, trxUsed: 0 };
    }
}

// Track wallet resource consumption
async function WalletResourceConsumption(walletName, txIds, tronWeb, initialEnergy, initialBandwidth, initialBalance) {
    let currentEnergy = initialEnergy;
    let currentBandwidth = initialBandwidth;
    let currentBalance = initialBalance;

    fs.appendFileSync(tronWalletResource, `${walletName} Initial Balances - Energy: ${currentEnergy}, BandWidth: ${currentBandwidth}, TRX: ${currentBalance}\n`);
    const trxRates = [];

    for (let i = 0; i < txIds.length; i++) {
        const transactionInfo = await fetchTransactionInfo(tronWeb, txIds[i]);
        currentBalance -= transactionInfo.trxUsed;
        currentEnergy = Math.max(0, currentEnergy - transactionInfo.energyUsed);

        fs.appendFileSync(tronWalletResource, `Transaction ${i + 1}: TRX Used: ${transactionInfo.trxUsed}, Energy Used: ${transactionInfo.energyUsed}, Balance: ${currentBalance}, Energy: ${currentEnergy}\n`);

        trxRates.push({ trxUsed: transactionInfo.trxUsed, energyUsed: transactionInfo.energyUsed });
    }

    console.log(trxRates);
}

// Send transaction dynamically and measure system resource usage
async function sendTransaction(contract, functionName, val, walletName, index) {
    try {
        const beforeStats = await pidusage(process.pid); // Capture CPU/Memory before transaction

        const startTime = Date.now();
        const tx = await contract.methods[functionName](val).send(); // Dynamic function call
        console.log(`Transaction sent from ${walletName}:`, tx);

        const endTime = Date.now();
        const latency = (endTime - startTime) / 1000;
        console.log(`Transaction ${index} from ${walletName}, Latency: ${latency}s`);

        const afterStats = await pidusage(process.pid); // Capture CPU/Memory after transaction
        const cpuUsage = (afterStats.cpu - beforeStats.cpu).toFixed(2);
        const memoryUsage = ((afterStats.memory - beforeStats.memory) / 1024 / 1024).toFixed(2); // Convert memory to MB

        console.log(`CPU used: ${cpuUsage}%, Memory used: ${memoryUsage} MB for this transaction`);
        fs.appendFileSync(resourceUsageLog, `Transaction ${index} - CPU Used: ${cpuUsage}%, Memory Used: ${memoryUsage} MB\n`);
        fs.appendFileSync(logFile, `Transaction ${index} from ${walletName}: Latency: ${latency}s\n`);

        return { latency, tx };
    } catch (error) {
        console.error(`Error executing transaction from ${walletName}:`, error);
        return null;
    }
}

// Measure average latency
function measureLatency(totalLatency, numOfTransactions, walletName) {
    const averageLatency = totalLatency / numOfTransactions;
    fs.appendFileSync(tpsAndLatencyLog, `Average Latency for ${walletName}: ${averageLatency}s\n`);
}

// Measure throughput (TPS)
async function measureThroughput(tronWeb, walletName, contractAddress) {
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
//
// Main function to execute transactions
async function executeTron(network, contractAddress, abi, functionName, value, numberOfTransactions) {
    // Initialize TronWeb instances for both wallets
    const tronWebA = new TronWeb({
        fullHost: network,
        privateKey: process.env.Tron_WalletA_PrivateKey
    });

    const tronWebB = new TronWeb({
        fullHost: network,
        privateKey: process.env.Tron_WalletB_PrivateKey
    });
    const contractInstanceA = tronWebA.contract(abi, contractAddress);
    const contractInstanceB = tronWebB.contract(abi, contractAddress);

    const wallets = [
        { tronWeb: tronWebA, contract: contractInstanceA, name: 'Wallet A (Energy-Paying)', txIds: [], energy: 0, bandwidth: 0, trxBalance: 0 },
        { tronWeb: tronWebB, contract: contractInstanceB, name: 'Wallet B (TRX-Paying)', txIds: [], energy: 0, bandwidth: 0, trxBalance: 0 },
    ];

    for (const wallet of wallets) {
        let totalLatency = 0;
        const { energy, bandwidth, trxBalance } = await getEnergyAndTRXBalance(wallet.tronWeb);
        wallet.energy = energy;
        wallet.bandwidth = bandwidth;
        wallet.trxBalance = trxBalance;
        const header = wallet.name ==="Wallet A (Energy-Paying)"? "Energy-Paying\n" : "TRX-Paying\n";
        fs.appendFileSync(logFile, `${header}`);
        fs.appendFileSync(tpsAndLatencyLog, `${header}`);
        fs.appendFileSync(resourceUsageLog, `${header}`);
        const sendAndMeasure = async () => {
            let val = value;
            for (let i = 0; i < numberOfTransactions; i++) {
                const { latency, tx } = await sendTransaction(wallet.contract, functionName, val, wallet.name,i+1);
                if (latency !== null) {
                    totalLatency += latency;
                }
                wallet.txIds.push(tx);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second interval between transactions
                val++;
            }
            if (totalLatency > 0) {
                measureLatency(totalLatency, numberOfTransactions, wallet.name);
            }
        };

        await Promise.all([sendAndMeasure(), measureThroughput(wallet.tronWeb, wallet.name, contractAddress)]);
    }

    await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for 4 seconds

    for (const wallet of wallets) {
        await WalletResourceConsumption(wallet.name, wallet.txIds, wallet.tronWeb, wallet.energy, wallet.bandwidth, wallet.trxBalance);
    }
}

module.exports = executeTron;
