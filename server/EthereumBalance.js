//https://eth-sepolia.g.alchemy.com/v2/j8pR71uR77igUWtSTwIBPBe2WBaQRxuV
// priv - 0xf4491d77d82f082f6c0c2fb417ae315992c522f752f207fe427b0a7ce2aad932
//const WalletAddress = '0xE79659315Fdc076Eaa954b3C37ee49EF9B5D01e1'; damaged


const { ethers } = require('ethers');
require('dotenv').config();
const provider = new ethers.providers.JsonRpcProvider(process.env.Holesky_Connect);
const WalletAddresses = JSON.parse(process.env.EthereumAddresses);
async function checkBalance() {
    for(let i=0;i<WalletAddresses.length;i++){
        const balance = await provider.getBalance(WalletAddresses[i]);
        console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
        // console.log(await provider.getTransactionCount(WalletAddresses[i], 'latest'));
    }
    
}

checkBalance();
