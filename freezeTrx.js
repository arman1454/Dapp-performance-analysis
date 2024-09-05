const TronWeb = require('tronweb');
require('dotenv').config();
// Set up TronWeb instance
const tronWeb = new TronWeb({
    fullHost: process.env.Nile_Connect, 
    privateKey: process.env.Tron_WalletA_PrivateKey
});

// Address (Base58 format)
const ownerAddress = process.env.Tron_WalletA_Address;

async function freezeTRXForEnergyV2() {
    try {
        // Amount of TRX to freeze (in SUN)
        const amountToFreeze = tronWeb.toSun(100); // 100 TRX converted to SUN

        // Resource type: ENERGY or BANDWIDTH
        const resourceType = 'ENERGY';

        // Use the freezeBalanceV2 method
        const freezeTransaction = await tronWeb.transactionBuilder.freezeBalanceV2(
            amountToFreeze,
            resourceType,
            ownerAddress
        );

        // Sign the transaction
        const signedTransaction = await tronWeb.trx.sign(freezeTransaction);

        // Broadcast the transaction to the network
        const broadcast = await tronWeb.trx.sendRawTransaction(signedTransaction);

        console.log('Freeze V2 Transaction successful:', broadcast);
    } catch (error) {
        console.error('Error freezing TRX for energy in V2:', error);
    }
}

freezeTRXForEnergyV2();
