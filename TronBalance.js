const TronWeb = require('tronweb');

// Create a new TronWeb instance (using Shasta test network)
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io'
});

// Replace with your generated wallet address
const walletAddress = 'TRoYuUqeFKMJqrVrkVqy1tLn7HfxKUevEy';

// Function to check the balance
async function checkBalance() {
    try {
        // Get balance in Sun (1 TRX = 1,000,000 Sun)
        const balanceInSun = await tronWeb.trx.getBalance(walletAddress);

        // Convert balance to TRX
        const balanceInTRX = tronWeb.fromSun(balanceInSun);

        console.log(`Balance for address ${walletAddress}: ${balanceInTRX} TRX`);
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

// Call the function
checkBalance();
