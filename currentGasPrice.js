const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/j8pR71uR77igUWtSTwIBPBe2WBaQRxuV');
async function main() {
    const gasPrice = await provider.getGasPrice();
    console.log(`Current Gas Price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} Gwei`);
}

main().catch(console.error);