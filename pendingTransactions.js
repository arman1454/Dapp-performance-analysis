const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/j8pR71uR77igUWtSTwIBPBe2WBaQRxuV');


async function checkPendingTransaction() {
    const txHash = "0x24359b015b7dcbbf5feb21089d7daa735782e4e7f22e70be22025a5535c33b88";
    const txReceipt = await provider.getTransactionReceipt(txHash);

    if (!txReceipt) {
        console.log('Transaction is still pending.');
    } else {
        console.log(`Transaction status: ${txReceipt.status}`);
    }
}

checkPendingTransaction();
