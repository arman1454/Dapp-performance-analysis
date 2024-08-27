const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    privateKey: '21BB2CD7F87A4C6ADE94215D9452A051F76B9DF2276865061FB343F8524AAEB4'
});

async function checkResources() {
    const account = await tronWeb.trx.getAccount('TRoYuUqeFKMJqrVrkVqy1tLn7HfxKUevEy');
    const accountResources = await tronWeb.trx.getAccountResources('TRoYuUqeFKMJqrVrkVqy1tLn7HfxKUevEy');

    console.log(`Remaining Energy: ${accountResources.EnergyLimit - accountResources.EnergyUsed}`);
    console.log(`Remaining Bandwidth: ${accountResources.freeNetLimit - accountResources.freeNetUsed}`);
    console.log(`Maximum Energy: ${accountResources.EnergyLimit}`);
    console.log(`Maximum Bandwidth: ${accountResources.freeNetLimit}`);
}

checkResources().catch(console.error);
