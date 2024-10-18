const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const executeEthereum = require('./EthereumParallel.js');
const executeTron = require('./TronParallel.js');
const { generateComparisonReport } = require('./analyzer');
require('dotenv').config();
const app = express();
app.use(bodyParser.json());

app.post('/execute', async (req, res) => {
    const { networks, contractAddresses, abi, functionName, params, numberOfTransactions } = req.body;

    if (!networks || !contractAddresses || !abi || !functionName || !params || !numberOfTransactions) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    // Paths to the generated text files
    const ethereumLogFile = path.join(__dirname, 'Ethereum_logs_individual.txt');
    const ethAvgLogFile = path.join(__dirname, 'Eth_logs_Avg.txt');
    const ethWalletResourceFile = path.join(__dirname, "EthWalletResourceUsage.txt");

    const tronLogFile = path.join(__dirname, 'Tron_logs_individual.txt');
    const tronAvgLogFile = path.join(__dirname, 'Tron_logs_Avg.txt');
    const tronWalletResourceFile = path.join(__dirname, 'TronWalletResourceUsage.txt');

    // Path for the comparison report file
    const comparisonReportFile = path.join(__dirname, 'Ethereum_vs_Tron_Comparison_Report.txt');

    // Function to delete old files
    const deleteOldFiles = () => {
        const filesToDelete = [
            ethereumLogFile,
            ethAvgLogFile,
            ethWalletResourceFile,
            tronLogFile,
            tronAvgLogFile,
            tronWalletResourceFile,
            comparisonReportFile
        ];

        filesToDelete.forEach(file => {
            if (fs.existsSync(file)) {
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
            executeEthereum(networks.Ethereum, contractAddresses.ethereum, abi, functionName, params, numberOfTransactions),
            executeTron(networks.Tron, contractAddresses.tron, abi, functionName, params, numberOfTransactions)
        ]);

        // Read Ethereum and Tron logs
        const ethAvgLogs = fs.readFileSync(ethAvgLogFile, 'utf8');
        const tronAvgLogs = fs.readFileSync(tronAvgLogFile, 'utf8');

        // Generate the comparison report
        const comparisonAnalysis = generateComparisonReport(ethAvgLogs, tronAvgLogs);

        // Save the comparison report to file
        fs.writeFileSync(comparisonReportFile, comparisonAnalysis);

        // only returning the avg and the comparison report in json
        res.status(200).json({
            message: 'Transactions executed and comparison report generated successfully.',
            ethereumLogs: ethAvgLogs, 
            tronLogs: tronAvgLogs,
            comparisonReport: comparisonAnalysis
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
