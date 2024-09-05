const TronWeb = require('tronweb');
const fs = require('fs');
const contractAbi = require('./TronABI.json');
require('dotenv').config();


const tronWebB = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: process.env.Tron_WalletB_PrivateKey
});

async function fetchTransactionInfo(tronWeb, transactionID) {
    try {
        const transaction = await tronWeb.trx.getTransactionInfo(transactionID);
        console.log(transaction);
        
        const energyUsed = transaction.receipt.energy_usage_total || 0;
        const trxUsed = (transaction.receipt.net_usage || 0) / 1e6; // Convert from sun to TRX

        return { energyUsed, trxUsed };
    } catch (error) {
        console.error('Error fetching transaction info:', error);
        return { energyUsed: 0, trxUsed: 0 };
    }
}

fetchTransactionInfo(tronWebB,"377bdf70bfadadbf1890422a3a216fb1ba6542e3acc1330f8e35f286afa4833e").catch (console.error);