const express = require('express');
const bodyParser = require('body-parser');
const executeEthereum = require('./Ethereum.js');
const executeTron = require('./Tron.js');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/execute', async (req, res) => {
    const { networks,contractAddresses, abi, functionName, value, numberOfTransactions } = req.body;

    if (!networks || !contractAddresses || !abi || !functionName || !value || !numberOfTransactions) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        // Run Ethereum and Tron scripts in parallel
        await Promise.all([
            executeEthereum(networks.Ethereum,contractAddresses.ethereum, abi, functionName, value, numberOfTransactions),
            executeTron(networks.Tron,contractAddresses.tron, abi, functionName, value, numberOfTransactions)
        ]);

        res.status(200).json({ message: 'Transactions executed successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
