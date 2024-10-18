// analyzer.js
const fs = require('fs');

const extractTPS = (log) => {
    const match = log.match(/TPS:\s([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
};

const extractResponseTime = (log) => {
    const match = log.match(/Average Response Time:\s([\d.]+)s/);
    return match ? parseFloat(match[1]) : null;
};

const extractAverageCost = (log, currency) => {
    const regex = currency === 'eth' ? /Average Ether Used:\s([\d.eE+-]+)/ : /Average Trx Used:\s([\d.eE+-]+)/;
    const match = log.match(regex);
    return match ? parseFloat(match[1]) : null;
};

// This function reads the logs, extracts metrics, and returns the comparison report
const generateComparisonReport = (ethLogs, tronLogs) => {
    // Market prices (can be dynamic or static)
    const ethMarketPrice = 2636.68;  // USD
    const trxMarketPrice = 0.16;     // USD
    // Extract metrics for Ethereum
    const ethTPS = extractTPS(ethLogs);
    const ethResponseTime = extractResponseTime(ethLogs);
    const avgEthUsed = extractAverageCost(ethLogs, 'eth');

    // Extract metrics for Tron
    const tronTPS = extractTPS(tronLogs);
    const tronResponseTime = extractResponseTime(tronLogs);
    const avgTrxUsed = extractAverageCost(tronLogs, 'trx');

    // Calculate total cost in USD
    const ethCostInUSD = avgEthUsed * ethMarketPrice;
    const trxCostInUSD = avgTrxUsed * trxMarketPrice;

    // Comparison calculations
    const tpsComparison = tronTPS / ethTPS;
    const responseTimeComparison = ethResponseTime / tronResponseTime;
    let costComparison, costMessage;
    if (ethCostInUSD > trxCostInUSD) {
        costComparison = ethCostInUSD / trxCostInUSD;
        costMessage = `Ethereum is approximately ${costComparison.toFixed(2)} times more expensive than Tron for these transactions in terms of USD.`;
    } else if (trxCostInUSD > ethCostInUSD) {
        costComparison = trxCostInUSD / ethCostInUSD;
        costMessage = `Tron is approximately ${costComparison.toFixed(2)} times more expensive than Ethereum for these transactions in terms of USD.`;
    } else {
        costComparison = 1;
        costMessage = `Both Ethereum and Tron cost the same for these transactions in terms of USD.`;
    }

    // Generate the comparison analysis
    const comparisonAnalysis = `
*** Ethereum vs Tron Performance Comparison ***

1. TPS Comparison:
Tron TPS: ${tronTPS.toFixed(3)}, Ethereum TPS: ${ethTPS.toFixed(3)}
Tron is approximately ${tpsComparison.toFixed(2)} times faster than Ethereum in terms of TPS.

2. Response Time Comparison:
Tron Response Time: ${tronResponseTime.toFixed(3)}s, Ethereum Response Time: ${ethResponseTime.toFixed(3)}s
Ethereum is approximately ${responseTimeComparison.toFixed(2)} times slower than Tron in terms of response time.

3. Cost Comparison (in USD):
Average Ether Used: ${avgEthUsed.toPrecision(12)} ETH (${ethCostInUSD.toFixed(6)} USD)
Average TRX Used: ${avgTrxUsed.toFixed(6)} TRX (${trxCostInUSD.toFixed(6)} USD)
${costMessage}

*** ***
`;

    return comparisonAnalysis;
};

module.exports = {
    generateComparisonReport
};
