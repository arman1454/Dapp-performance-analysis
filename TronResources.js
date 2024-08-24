const TronWeb = require('tronweb');

// Set up TronWeb instance
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
});

// Function to check Energy and Bandwidth
async function checkResources(address) {
    try {
        const account = await tronWeb.trx.getAccountResources(address);

        // Free Bandwidth available to the account
        const freeBandwidth = account.freeNetLimit || 0;
        // Paid Bandwidth (if any)
        const paidBandwidth = account.NetLimit || 0;
        // Total bandwidth available (free + paid)
        const bandwidth = freeBandwidth + paidBandwidth;

        // Energy available to the account
        const energy = account.EnergyLimit || 0;

        console.log(`Address: ${address}`);
        console.log(`Bandwidth: ${bandwidth}`);
        console.log(`Energy: ${energy}`);
    } catch (error) {
        console.error("Error fetching resources:", error);
    }
}

// Replace with your generated wallet address
const walletAddress = 'TRoYuUqeFKMJqrVrkVqy1tLn7HfxKUevEy';
checkResources(walletAddress);
