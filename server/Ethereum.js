const { ethers } = require('ethers');
const pidusage = require('pidusage'); // Import pidusage for resource monitoring
const fs = require('fs');
require('dotenv').config();
// Log files for transactions and resource utilization
const logFile = 'Ethereum_logs_individual.txt';
const tpsAndLatencyLog = 'Eth_TPS&AvgLatency_log.txt';
const ethWalletResource = "EthWalletResourceUsage.txt";
const resourceUsageLog = 'Ethereum_Resource_Usage.txt';

// This function will be called from `server.js`
async function executeEthereum(network,contractAddress, contractAbi, functionName, value, numberOfTransactions) {
    // Initialize the Ethereum provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(network);
    const privateKey = process.env.Private_Key;
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractAbi, wallet);

    // Measurement period in seconds
    const measurementPeriod = 60;

    async function sendTransactions() {
        async function executeTransaction(val, gasPriceMultiplier, index) {
            try {
                // Capture resource usage before the transaction
                const beforeStats = await pidusage(process.pid);

                const baseGasPrice = await provider.getGasPrice();
                const gasPrice = baseGasPrice.mul(gasPriceMultiplier);

                // Estimate the gas required for this transaction
                const gasLimit = await contract.estimateGas[functionName](val, { gasPrice });

                const startTime = Date.now();
                // Include the estimated gasLimit along with the gasPrice
                const tx = await contract[functionName](val, { gasPrice, gasLimit });
                console.log(`Transaction ${index} sent with gasPrice ${gasPrice.toString()} and gasLimit ${gasLimit.toString()}:`, tx.hash);

                const receipt = await tx.wait();
                const endTime = Date.now();

                const latency = (endTime - startTime) / 1000;
                console.log(`Transaction ${index} mined: ${receipt.transactionHash}, Latency: ${latency}s`);

                const gasUsed = receipt.gasUsed;
                const transactionCost = gasUsed.mul(gasPrice);
                const etherUsed = ethers.utils.formatEther(transactionCost);
                console.log(`Gas used: ${gasUsed.toString()}, Ether used: ${etherUsed} ETH`);

                // Capture resource usage after the transaction
                const afterStats = await pidusage(process.pid);

                // Calculate resource usage differences
                const cpuUsage = (afterStats.cpu - beforeStats.cpu).toFixed(2);
                const memoryUsage = ((afterStats.memory - beforeStats.memory) / 1024 / 1024).toFixed(2); // In MB

                console.log(`Transaction ${index} - CPU used: ${cpuUsage}%, Memory used: ${memoryUsage} MB`);

                // Log to files
                fs.appendFileSync(logFile, `Transaction ${index} , Latency: ${latency}s\n`);
                fs.appendFileSync(ethWalletResource, `Transaction ${index}: GasPrice: ${gasPrice.toString()}, GasLimit: ${gasLimit.toString()}, Ether Used: ${etherUsed} ETH\n`)
                fs.appendFileSync(resourceUsageLog, `Transaction ${index} - CPU Used: ${cpuUsage}%, Memory Used: ${memoryUsage} MB\n`);

                return latency;
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


        function measureLatency(totalLatency, numOfTransactions) {
            const averageLatency = totalLatency / numOfTransactions;
            console.log(`Average Latency: ${averageLatency}s`);
            fs.appendFileSync(tpsAndLatencyLog, `Average Latency: ${averageLatency}s\n`);
        }

        const gasPriceMultipliers = [1,2];

        for (const multiplier of gasPriceMultipliers) {
            const header = multiplier === 1 ? 'Default gas Price\n' : `${multiplier}x the default gas Price\n`;
            fs.appendFileSync(logFile, `${header}`);
            fs.appendFileSync(tpsAndLatencyLog, `${header}`);
            fs.appendFileSync(ethWalletResource,`${header}`);
            fs.appendFileSync(resourceUsageLog,`${header}`);
            const sendAndMeasure = async () => {
                let totalLatency = 0;
                for (let i = 0; i < numberOfTransactions; i++) {
                    const latency = await executeTransaction(value, multiplier, i + 1); // Pass transaction index
                    if (latency !== null) {
                        totalLatency += latency;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between transactions
                    value++; // Increment the value for the next transaction
                }
                if (totalLatency > 0) {
                    measureLatency(totalLatency, numberOfTransactions);
                }
            };

            await Promise.all([sendAndMeasure(), measureTPS()]);
        }
    }

    async function measureTPS() {
        const startBlockNumber = await provider.getBlockNumber();
        await new Promise(resolve => setTimeout(resolve, measurementPeriod * 1000));

        const endBlockNumber = await provider.getBlockNumber();
        let transactionCount = 0;

        for (let i = startBlockNumber; i <= endBlockNumber; i++) {
            const block = await provider.getBlockWithTransactions(i);
            transactionCount += block.transactions.filter(tx => tx.to === contractAddress).length;
        }

        const tps = transactionCount / measurementPeriod;
        const timestamp = new Date().toISOString();
        console.log(`Throughput (TPS): ${tps} at ${timestamp}`);

        fs.appendFileSync(tpsAndLatencyLog, `Throughput (TPS): ${tps} at ${timestamp}\n`);
    }

    await sendTransactions(); // Send transactions
}

// Export the function so it can be called from server.js
module.exports = executeEthereum;
