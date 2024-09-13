//https://eth-sepolia.g.alchemy.com/v2/j8pR71uR77igUWtSTwIBPBe2WBaQRxuV
// priv - 0xf4491d77d82f082f6c0c2fb417ae315992c522f752f207fe427b0a7ce2aad932
//const WalletAddress = '0xE79659315Fdc076Eaa954b3C37ee49EF9B5D01e1'; damaged


const { ethers } = require('ethers');
require('dotenv').config();
// const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_CONNECT);
const provider = new ethers.providers.JsonRpcProvider(process.env.Holesky_Connect);

const WalletAddress = '0x48B5B6435f773e5a4Dc02de1d7f5850ec7f3e7B7';
// Private Key: 0xec72f1d9f20d8056902d301da1ff8d08029adf05420bf97c485162e9c3244ccd
async function checkBalance() {
    const balance = await provider.getBalance(WalletAddress);
    console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
}

checkBalance();
