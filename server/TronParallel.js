const TronWeb = require('tronweb');
const pidusage = require('pidusage');
const fs = require('fs');
require('dotenv').config();

// Log files for transactions and resource utilization
const logFile = 'Tron_logs_individual.txt';
const avgLogs = 'Tron_logs_Avg.txt';
const tronWalletResource = 'TronWalletResourceUsage.txt';

// This function will be called from `server.js`
async function executeTron(network, contractAddress, abi, functionName, params, numberOfTransactions) {
    // Initialize TronWeb instances for both wallets
const privateKeys = JSON.parse(process.env.TronPrivateKeys);
    const txIds = []
    const tronWeb = new TronWeb({
        fullHost: network,
        privateKey: privateKeys[0]
    });

    const wallets = []

    for (let i = 0; i < privateKeys.length; i++) {
        const wallet = new TronWeb({
            fullHost: network,
            privateKey: privateKeys[i]
        });

        wallets.push(wallet)
    }

    // Fetch transaction info using the transaction hash
 

    async function sendTransactions() {

        async function fetchTransactionInfo(tronWeb, transactionID) {
            try {
                const transaction = await tronWeb.trx.getTransactionInfo(transactionID);
                const energyUsed = transaction.receipt.energy_usage_total || 0;
                const trxUsed = (transaction.fee || 0) / 1e6; // Convert from sun to TRX
                const bandwidthUsed = (transaction.receipt.net_fee || 0) / 1e3;
                return { energyUsed, bandwidthUsed, trxUsed };
            } catch (error) {
                console.error('Error fetching transaction info:', error);
                return { energyUsed: 0, trxUsed: 0 };
            }
        }

        async function executeTransaction(contract, functionName, params, index) {
            try {
                const startTime = Date.now();
                const tx = await contract.methods[functionName](params.value).send(); // Dynamic function call
                console.log(`Transaction ${index} sent`, tx);

                const endTime = Date.now();
                const responseTime = (endTime - startTime) / 1000;
                console.log(`Transaction ${index}, Latency: ${responseTime}s`);
 
                txIds.push(tx)
                fs.appendFileSync(logFile, `Transaction ${index}: Latency: ${responseTime}s\n`); 

                return responseTime;
            } catch (error) {
                console.error(error);
                return null;
            }
        }

        // Measure average latency
        function measureAvgResponseTime(totalResponseTime, numOfTransactions) {
            const averageResponseTime = totalResponseTime / numOfTransactions;
            fs.appendFileSync(avgLogs, `Average Response Time: ${averageResponseTime}s\n`);
        }

        function measureAvgTrxUsed(totalTrxUsed,numberOfTransactions){
            const avgTrxUsed = totalTrxUsed/numberOfTransactions
            fs.appendFileSync(avgLogs, `Average Trx Used: ${avgTrxUsed}s\n`);
        }

        const sendAndMeasure = async () => {
            const transactionPromises = [];
            let totalResponseTime = 0;
            let walletCount = 0
            for (let i = 0; i < numberOfTransactions; i++) {
                const contractInstance = wallets[walletCount].contract(abi, contractAddress);
                const transactionPromise = executeTransaction(contractInstance, functionName, params, i + 1);
                transactionPromises.push(transactionPromise);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second interval between transactions
                walletCount++;
                if (walletCount === wallets.length) {
                    walletCount = 0;
                }
            }
            const responseTimes = await Promise.all(transactionPromises);
            responseTimes.forEach(responseTime => {
                if (responseTime !== null) {
                    totalResponseTime += responseTime;
                }
            });
            
            const TimeTaken = Math.max(...responseTimes)
            const tps = numberOfTransactions / TimeTaken;
            console.log(`TPS: ${tps}`);
            fs.appendFileSync(avgLogs, `TPS: ${tps} over ${TimeTaken}s\n`);

            if (totalResponseTime > 0) {
                measureAvgResponseTime(totalResponseTime, numberOfTransactions);
            }
        };

        await Promise.all([sendAndMeasure(), BlockGeneration()]);

        async function BlockGeneration() {
            try {
                const startBlock = await tronWeb.trx.getCurrentBlock();
                const startBlockNum = startBlock.block_header.raw_data.number;

                await new Promise(resolve => setTimeout(resolve, 60 * 1000));

                const endBlock = await tronWeb.trx.getCurrentBlock();
                const endBlockNum = endBlock.block_header.raw_data.number;
                const BlockRate = (endBlockNum - startBlockNum) / 60
                const timestamp = new Date().toISOString();
                fs.appendFileSync(avgLogs, `Blocks Produced: ${endBlockNum - startBlockNum}, Block Production Rate: ${BlockRate}/sec at ${timestamp}\n`);
            } catch (error) {
                console.error(`Error measuring throughput for:`, error);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 4000));
        let totalTrxUsed = 0
        for (let i = 0; i < txIds.length; i++) {
            const transactionInfo = await fetchTransactionInfo(tronWeb, txIds[i]);
            totalTrxUsed+=transactionInfo.trxUsed;
            fs.appendFileSync(tronWalletResource, `Trx Used : ${transactionInfo.trxUsed}: Energy Required: ${transactionInfo.energyUsed}: Bandwidth Required: ${transactionInfo.bandwidthUsed}\n`);
        }
        measureAvgTrxUsed(totalTrxUsed,txIds.length)
    }

    await sendTransactions(); 
}


module.exports = executeTron;
