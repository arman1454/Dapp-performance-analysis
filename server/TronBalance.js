const TronWeb = require('tronweb');
require('dotenv').config();
// Create a new TronWeb instance (using Shasta test network)
const tronWeb = new TronWeb({
    fullHost: process.env.Shasta_Connect
});
const WalletAddresses = JSON.parse(process.env.TronAddresses);
// Replace with your generated wallet address
// const walletAddress ="TQTWciWkfKmWX77GqcVXeYUpF6LDJdaGmP";

// Function to check the balance
async function checkBalance() {
    try {
        for(let i= 0; i<WalletAddresses.length;i++){
            // Get balance in Sun (1 TRX = 1,000,000 Sun)
            const balanceInSun = await tronWeb.trx.getBalance(WalletAddresses[i]);
            const balanceInTRX = tronWeb.fromSun(balanceInSun);
            console.log(`Balance for address ${WalletAddresses[i]}: ${balanceInTRX} TRX`);

        }

        // Convert balance to TRX

    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

// Call the function
checkBalance();
