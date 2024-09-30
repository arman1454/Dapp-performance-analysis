const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const executeEthereum = require('./Ethereum.js');
const executeTron = require('./Tron.js');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/execute', async (req, res) => {
    const { networks, contractAddresses, abi, functionName, value, numberOfTransactions } = req.body;

    if (!networks || !contractAddresses || !abi || !functionName || !value || !numberOfTransactions) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    // Paths to the generated text files
    const ethereumLogFile = path.join(__dirname, 'Ethereum_logs_individual.txt');
    const ethTPSLogFile = path.join(__dirname, 'Eth_TPS&AvgLatency_log.txt');
    const ethWalletResourceFile = path.join(__dirname,"EthWalletResourceUsage.txt");
    const ethResourceLogFile = path.join(__dirname, 'Ethereum_Resource_Usage.txt');

    const tronLogFile = path.join(__dirname, 'Tron_logs_individual.txt'); // Assuming you have a similar file for Tron
    const tronTPSLogFile = path.join(__dirname, 'Tron_TPS&AvgLatency_log.txt');
    const tronWalletResourceFile = path.join(__dirname, 'TronWalletResourceUsage.txt');
    const tronResourceLogFile = path.join(__dirname, 'Tron_Resource_Usage.txt');
    

    // Function to delete old files
    const deleteOldFiles = () => {
        const filesToDelete = [
            ethereumLogFile,
            ethTPSLogFile,
            ethWalletResourceFile,
            ethResourceLogFile,
            tronLogFile,
            tronTPSLogFile,
            tronWalletResourceFile,
            tronResourceLogFile,
        ];

        filesToDelete.forEach(file => {
            if (fs.existsSync(file)) { // Check if the file exists before trying to delete
                fs.unlinkSync(file);
                console.log(`Deleted old file: ${file}`);
            }
        });
    };

    try {
        // Delete old log files before running the scripts
        deleteOldFiles();

        // Run Ethereum and Tron scripts in parallel
        await Promise.all([
            executeEthereum(networks.Ethereum, contractAddresses.ethereum, abi, functionName, value, numberOfTransactions),
            executeTron(networks.Tron, contractAddresses.tron, abi, functionName, value, numberOfTransactions)
        ]);

        // Read file contents
        const ethereumLogs = fs.readFileSync(ethereumLogFile, 'utf8');
        const ethTPSLogs = fs.readFileSync(ethTPSLogFile, 'utf8');
        const ethWalletResourceLogs = fs.readFileSync(ethWalletResourceFile, 'utf8');
        const ethResourceLogs = fs.readFileSync(ethResourceLogFile, 'utf8');

        const tronLogs = fs.readFileSync(tronLogFile, 'utf8');
        const tronTPSLogs = fs.readFileSync(tronTPSLogFile, 'utf8');
        const tronWalletResourceLogs = fs.readFileSync(tronWalletResourceFile, 'utf8');
        const tronResourceLogs = fs.readFileSync(tronResourceLogFile, 'utf8');
        // Send the contents as response
        res.status(200).json({
            message: 'Transactions executed successfully.',
            ethereumLogs,
            ethTPSLogs,
            ethWalletResourceLogs,
            ethResourceLogs,
            tronLogs,
            tronTPSLogs,
            tronWalletResourceLogs,
            tronResourceLogs,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
