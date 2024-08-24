const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: '21BB2CD7F87A4C6ADE94215D9452A051F76B9DF2276865061FB343F8524AAEB4'
});

const contractAddress = 'TWLNxWm6CKHTPgtpzjaJrhpcSbxdg7uWBW';
const contractAbi = require('./TronABI.json'); // Replace with your contract ABI

const walletAddress = tronWeb.address.toHex(tronWeb.defaultAddress.base58); // Wallet address in hex

async function estimateSetValResources() {
    try {
        const options = {
            feeLimit: 100000000, // 100 TRX in SUN (1 TRX = 1,000,000 SUN)
            callValue: 0, // No TRX sent with the transaction
        };

        // Estimate Energy
        const energyEstimate = await tronWeb.transactionBuilder.estimateEnergy(
            tronWeb.address.toHex(contractAddress), // Convert contractAddress to hexString
            'setval(uint256)', // Function signature
            options, // Optional fields
            [{ type: 'uint256', value: 12 }], // Parameters in an array
            walletAddress // Issuer's address in hexString
        );

        console.log(`Estimated Energy for setVal: ${energyEstimate.energy_required} Energy`);

        // Trigger the contract to get the Bandwidth usage
        const parameter = [{ type: 'uint256', value: 12 }];
        const transaction = await tronWeb.transactionBuilder.triggerConstantContract(
            tronWeb.address.toHex(contractAddress),
            'setval(uint256)',
            options,
            parameter,
            walletAddress
        );
        // console.log(transaction);
        
        // Calculate Bandwidth from the raw data hex
        const bandwidthUsage = Buffer.from(transaction.transaction.raw_data_hex, 'hex').length;

        console.log(`Estimated Bandwidth for setVal: ${bandwidthUsage} bytes`);

    } catch (error) {
        console.error('Error estimating resources for setVal:', error);
    }
}

estimateSetValResources();



