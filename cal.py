# Conversion rates
trx_to_eth_rate = 0.000065  # 1 TRX = 0.000065 ETH
trx_to_usd_rate = 0.15      # 1 TRX = 0.15 USD
eth_to_usd_rate = 2354.12    # 1 ETH = 2354.12 USD

# Function to extract TPS and Latency from log files
def extract_tps_latency(file_path):
    tps_values = []
    latency_values = []
    
    with open(file_path, "r") as file:
        for line in file:
            if "Throughput (TPS)" in line:
                tps = float(line.split(": ")[1].split(" ")[0])
                tps_values.append(tps)
            elif "Average Latency" in line:
                latency = float(line.split(": ")[1].replace("s", "").strip())
                latency_values.append(latency)
    
    return tps_values, latency_values

# Function to extract Wallet Resource usage from Ethereum logs
def extract_ethereum_data(file_path):
    ethereum_default_eth_costs = []
    ethereum_2x_eth_costs = []
    ethereum_default_usd_costs = []
    ethereum_2x_usd_costs = []
    is_default_gas = True
    
    with open(file_path, "r") as file:
        lines = file.readlines()
        for line in lines:
            if "2x the default gas Price" in line:
                is_default_gas = False  # Switch to 2x gas price

            if "Ether Used" in line:
                eth_used_str = line.split("Ether Used:")[1].split("ETH")[0].strip()
                eth_used = float(eth_used_str)
                
                # Calculate USD equivalent
                eth_cost_usd = eth_used * eth_to_usd_rate
                
                if is_default_gas:
                    ethereum_default_eth_costs.append(eth_used)
                    ethereum_default_usd_costs.append(eth_cost_usd)
                else:
                    ethereum_2x_eth_costs.append(eth_used)
                    ethereum_2x_usd_costs.append(eth_cost_usd)
    
    return ethereum_default_eth_costs, ethereum_2x_eth_costs, ethereum_default_usd_costs, ethereum_2x_usd_costs

# Function to extract Wallet Resource usage from Tron logs
def extract_tron_data(file_path):
    tron_wallet_a_trx_costs = []
    tron_wallet_b_trx_costs = []
    is_wallet_a = True
    
    with open(file_path, "r") as file:
        lines = file.readlines()
        for line in lines:
            if "Wallet B" in line:
                is_wallet_a = False  # Switch to Wallet B

            if "TRX Used" in line:
                try:
                    trx_used_str = line.split("TRX Used:")[1].split(",")[0].strip()
                    trx_used = float(trx_used_str) if trx_used_str else 0.0
                except (IndexError, ValueError):
                    trx_used = 0.0

                if is_wallet_a:
                    tron_wallet_a_trx_costs.append(trx_used)
                else:
                    tron_wallet_b_trx_costs.append(trx_used)
    
    return tron_wallet_a_trx_costs, tron_wallet_b_trx_costs

# Function to compare TPS, Latency, and Cost
def compare_values(eth_tps, eth_latency, tron_tps, tron_latency, scenario):
    tps_comparison = tron_tps / eth_tps if eth_tps > 0 else float('inf')
    latency_comparison = eth_latency / tron_latency if tron_latency > 0 else float('inf')

    comparison_text = f"\n## {scenario} ##\n"
    comparison_text += f"Ethereum TPS: {eth_tps}, Tron TPS: {tron_tps}\n"
    comparison_text += f"Ethereum Latency: {eth_latency}s, Tron Latency: {tron_latency}s\n"
    comparison_text += f"Tron TPS is {tps_comparison:.2f}x faster than Ethereum\n"
    comparison_text += f"Ethereum Latency is {latency_comparison:.2f}x slower than Tron\n"
    
    return comparison_text

# File paths for Ethereum and Tron logs
eth_tps_latency_file = 'Eth_TPS&AvgLatency_log.txt'
tron_tps_latency_file = 'Tron_TPS&AvgLatency_log.txt'
ethereum_resource_file = "Ethereum_logs_individual.txt"
tron_resource_file = "WalletResourceUsage.txt"

# Extract TPS and Latency data
eth_tps_values, eth_latency_values = extract_tps_latency(eth_tps_latency_file)
tron_tps_values, tron_latency_values = extract_tps_latency(tron_tps_latency_file)

# Extract Wallet Resource Usage data
ethereum_default_eth_costs, ethereum_2x_eth_costs, ethereum_default_usd_costs, ethereum_2x_usd_costs = extract_ethereum_data(ethereum_resource_file)
tron_wallet_a_trx_costs, tron_wallet_b_trx_costs = extract_tron_data(tron_resource_file)

# Summing up total costs for Ethereum and Tron Wallet A and B
total_ethereum_default_usd = sum(ethereum_default_usd_costs)
total_ethereum_2x_usd = sum(ethereum_2x_usd_costs)
total_tron_wallet_a_usd = sum(tron_wallet_a_trx_costs) * trx_to_usd_rate
total_tron_wallet_b_usd = sum(tron_wallet_b_trx_costs) * trx_to_usd_rate

# Comparison calculations
eth_vs_tron_a_usd_default = total_ethereum_default_usd / total_tron_wallet_a_usd if total_tron_wallet_a_usd > 0 else float('inf')
eth_vs_tron_b_usd_default = total_ethereum_default_usd / total_tron_wallet_b_usd if total_tron_wallet_b_usd > 0 else float('inf')
eth_vs_tron_a_usd_2x = total_ethereum_2x_usd / total_tron_wallet_a_usd if total_tron_wallet_a_usd > 0 else float('inf')
eth_vs_tron_b_usd_2x = total_ethereum_2x_usd / total_tron_wallet_b_usd if total_tron_wallet_b_usd > 0 else float('inf')

# Comparison Results
comparison_results = ""

# Scenario 1: Ethereum Default Gas Price vs Tron Wallet A (Energy)
comparison_results += compare_values(
    eth_tps_values[0], eth_latency_values[0], 
    tron_tps_values[0], tron_latency_values[0], 
    "Ethereum Default Gas Price vs Tron Wallet A (Energy)"
)

# Scenario 2: Ethereum 2x Gas Price vs Tron Wallet B (TRX)
comparison_results += compare_values(
    eth_tps_values[1], eth_latency_values[1], 
    tron_tps_values[1], tron_latency_values[1], 
    "Ethereum 2x Gas Price vs Tron Wallet B (TRX)"
)

# Append Wallet Resource Usage Comparisons
comparison_results += f"""
Total Ethereum Cost (Default Gas Price): ${total_ethereum_default_usd:.2f}
Total Ethereum Cost (2x Gas Price): ${total_ethereum_2x_usd:.2f}
Total Tron Cost (Wallet A - Energy-Paying): ${total_tron_wallet_a_usd:.2f}
Total Tron Cost (Wallet B - TRX-Paying): ${total_tron_wallet_b_usd:.2f}

## Ethereum vs Tron Wallet A (Energy) - Default Gas ##
Ethereum Cost is {eth_vs_tron_a_usd_default:.2f}x higher than Tron Wallet A

## Ethereum vs Tron Wallet B (TRX) - Default Gas ##
Ethereum Cost is {eth_vs_tron_b_usd_default:.2f}x higher than Tron Wallet B

## Ethereum vs Tron Wallet A (Energy) - 2x Gas ##
Ethereum Cost is {eth_vs_tron_a_usd_2x:.2f}x higher than Tron Wallet A

## Ethereum vs Tron Wallet B (TRX) - 2x Gas ##
Ethereum Cost is {eth_vs_tron_b_usd_2x:.2f}x higher than Tron Wallet B
"""

# Write the consolidated report to a text file
output_file = "consolidated_comparison_report.txt"
with open(output_file, "w") as file:
    file.write(comparison_results)

print(f"Consolidated comparison report generated and saved as {output_file}")
