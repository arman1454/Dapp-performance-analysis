const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();
//md.danial.islam@g.bracu.ac.bd
// Log files for transactions and resource utilization
const logFile = 'Ethereum_logs_individual.txt';
const avgLogs = 'Eth_logs_Avg.txt';
const ethWalletResource = "EthWalletResourceUsage.txt";

// This function will be called from `server.js`
async function executeEthereum(network, contractAddress, contractAbi, functionName, params, numberOfTransactions) {
    // Initialize the Ethereum provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(network);
    const privateKeys = JSON.parse(process.env.EthereumPrivateKeys);
    const wallets = [];
    for (let i = 0; i < privateKeys.length; i++) {
        const wallet = new ethers.Wallet(privateKeys[i], provider);
        wallets.push(wallet);
    }

    async function sendTransactions() {
        async function executeTransaction(gasPriceMultiplier, index, wallet, nonce) {
            const contract = new ethers.Contract(contractAddress, contractAbi, wallet);
            try {

                const baseGasPrice = await provider.getGasPrice();
                const gasPrice = baseGasPrice.mul(gasPriceMultiplier);
                // Estimate the gas required for this transaction
                const gasLimit = await contract.estimateGas[functionName](params.value, { gasPrice });

                // Step 1: Record the time when the transaction is sent
                const startTime = process.hrtime(); // Start high-resolution time

                const submissionTime = Date.now();
                // Include the estimated gasLimit along with the gasPrice
                const tx = await contract[functionName](params.value, { gasPrice, gasLimit, nonce });
                console.log(`Transaction ${index} sent with gasPrice ${gasPrice.toString()} and gasLimit ${gasLimit.toString()}:`, tx.hash);
                
                let mempoolEntryTime;
                let pickedUpTime;
                while (true) {
                    const mempoolTx = await provider.getTransaction(tx.hash);
                    // console.log(mempoolTx);

                    if (mempoolTx !== null && mempoolTx.blockNumber === null) {
                        // Transaction has reached the mempool
                        // console.log(await provider.getTransactionReceipt(tx.hash))
                        mempoolEntryTime = Date.now();
                        console.log(`Transaction is now in the mempool!`);
                        break;
                    }

                    // Wait 1 second before checking again
                    // await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Step 2: Track when the transaction is picked up by a miner
                while (true) {
                    const mempoolTx = await provider.getTransactionReceipt(tx.hash);

                    if (mempoolTx !== null) {
                        // console.log(mempoolTx);

                        pickedUpTime = Date.now();  // The moment it was picked up (when the block number is assigned)
                        console.log(`Transaction picked up by miner!`);
                        console.log(`Transaction mined in block: ${mempoolTx.blockNumber}`);
                        break;
                    }

                    // Wait 1 second before checking again
                    // await new Promise(resolve => setTimeout(resolve, 100));
                }
                // Calculate the different stages
                const timeToReachMempool = (mempoolEntryTime - submissionTime) / 1000; // In seconds
                const timeInMempool = (pickedUpTime - mempoolEntryTime) / 1000; // Time waiting in the mempool

                // Step 4: Calculate total latency
                const endTime = process.hrtime(startTime); // End high-resolution time
                const responseTime = endTime[0] + endTime[1] / 1e9;

                const gasUsed = (await provider.getTransactionReceipt(tx.hash)).gasUsed;
                const transactionCost = gasUsed.mul(gasPrice);
                const etherUsed = Number(ethers.utils.formatEther(transactionCost));
                console.log(`Transaction ${index} mined: ${tx.hash}, Response Time: ${responseTime}s`);

                // Log to files
                fs.appendFileSync(logFile, `Transaction ${index}, Response Time: ${responseTime}s, Mempool Reaching Time: ${timeToReachMempool} Mempool Time: ${timeInMempool}s\n`);
                fs.appendFileSync(ethWalletResource, `Transaction ${index}: GasPrice: ${gasPrice.toString()}, GasLimit: ${gasLimit.toString()}, Ether Used: ${etherUsed} ETH\n`);

                // return { totalLatency, mempoolTime, inclusionTime };
                return {responseTime,etherUsed}
            } catch (error) {
                // Enhanced error handling for various scenarios
                if (error.code === 'INSUFFICIENT_FUNDS') {
                    console.error(`Error: Insufficient funds for transaction ${index}.`);
                } else if (error.code === 'NETWORK_ERROR') {
                    console.error(`Network error encountered during transaction ${index}.`);
                } else {
                    console.error(`Error executing transaction ${index}:`, error.message);
                }
                return null;
            }
        }

        function measureAvgResponseTime(totalResponseTime, numOfTransactions) {
            const averageResponse = totalResponseTime / numOfTransactions;
            console.log(`Average Response Time: ${averageResponse}s`);
            fs.appendFileSync(avgLogs, `Average Response Time: ${averageResponse}s\n`);
        }

        function measureAvgEtherUsed(totalEtherUsed,numberOfTransactions){
            const avgEtherUsed = totalEtherUsed/numberOfTransactions
            fs.appendFileSync(avgLogs, `Average Ether Used: ${avgEtherUsed}\n`);
        }

        const gasPriceMultipliers = [1];
        for (const multiplier of gasPriceMultipliers) {
            let walletCount = 0;
            const header = multiplier === 1 ? 'Default gas Price\n' : `${multiplier}x the default gas Price\n`;
            fs.appendFileSync(logFile, `${header}`);
            fs.appendFileSync(avgLogs, `${header}`);
            fs.appendFileSync(ethWalletResource, `${header}`);

            const sendAndMeasure = async () => {
                const transactionPromises = [];
                let totalResponseTime = 0;
                let totalEtherUsed = 0
                const walletNonces = {};
                for (let i = 0; i < numberOfTransactions; i++) {
                    const wallet = wallets[walletCount];
                    if (!walletNonces[wallet.address]) {
                        walletNonces[wallet.address] = await provider.getTransactionCount(wallet.address, 'latest');
                    }

                    const currentNonce = walletNonces[wallet.address];
                    const transactionPromise= executeTransaction(multiplier, i + 1, wallet, currentNonce); // Pass transaction index
                    transactionPromises.push(transactionPromise);
                    walletNonces[wallet.address]++;
                    // await new Promise(resolve => setTimeout(resolve, 2000));
                    walletCount++;
                    if (walletCount === wallets.length) {
                        walletCount = 0;
                    }
                }

                const results = await Promise.all(transactionPromises);
                const validResults = results.filter(result => result !== null);
                validResults.forEach(({ responseTime, etherUsed }) => {
                    totalResponseTime += responseTime;
                    totalEtherUsed += etherUsed;
                });
                const timeTaken = Math.max(...validResults.map(r => r.responseTime));
                const tps = numberOfTransactions / timeTaken;
                console.log(`TPS: ${tps}`);
                fs.appendFileSync(avgLogs, `TPS: ${tps} over ${timeTaken}s\n`);

                if (totalResponseTime > 0) {
                    measureAvgResponseTime(totalResponseTime, numberOfTransactions);
                    measureAvgEtherUsed(totalEtherUsed,validResults.length)
                }
            };

            await Promise.all([sendAndMeasure(), BlockGeneration()]);
        }
        
        
        async function BlockGeneration() {
            const startBlockNumber = await provider.getBlockNumber();
            await new Promise(resolve => setTimeout(resolve, 60 * 1000));

            const endBlockNumber = await provider.getBlockNumber();
            const BlockRate = (endBlockNumber - startBlockNumber) / 60
            const timestamp = new Date().toISOString();
            fs.appendFileSync(avgLogs, `Blocks Produced: ${endBlockNumber - startBlockNumber}, Block Production Rate: ${BlockRate}/sec at ${timestamp}\n`);
        }
    }

    

    await sendTransactions(); // Send transactions
}

module.exports = executeEthereum;
