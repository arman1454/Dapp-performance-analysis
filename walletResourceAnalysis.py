# # Constants for conversion rates
# TRX_TO_ETH = 0.000065  # 1 TRX = 0.000065 ETH
# TRX_TO_USD = 0.15      # 1 TRX = 0.15 USD
# ETH_TO_USD = 2338      # 1 ETH = 2338 USD

# # Function to extract Ethereum data from the txt file
# def extract_ethereum_data(filename):
#     default_gas_costs = []
#     double_gas_costs = []
#     with open(filename, 'r') as file:
#         lines = file.readlines()
#         default_gas_price = True
#         for line in lines:
#             if "2x the default gas Price" in line:
#                 default_gas_price = False
#             elif "GasPrice:" in line:
#                 parts = line.split(", ")
#                 ether_used_str = parts[2].split(": ")[1].split(" ")[0]
#                 ether_used = float(ether_used_str)
#                 if default_gas_price:
#                     default_gas_costs.append(ether_used)
#                 else:
#                     double_gas_costs.append(ether_used)
#     return default_gas_costs, double_gas_costs

# # Function to extract Tron data from the txt file
# def extract_tron_data(filename):
#     wallet_a_trx_costs = []
#     wallet_b_trx_costs = []
#     with open(filename, 'r') as file:
#         lines = file.readlines()
#         is_wallet_b = False
#         for line in lines:
#             if "Wallet B" in line:
#                 is_wallet_b = True
#             elif "TRX Used:" in line:
#                 trx_used_str = line.split("TRX Used: ")[1].split(",")[0].strip()
#                 trx_used = float(trx_used_str)
#                 if not is_wallet_b:
#                     wallet_a_trx_costs.append(trx_used)
#                 else:
#                     wallet_b_trx_costs.append(trx_used)
#     return wallet_a_trx_costs, wallet_b_trx_costs

# # File paths
# ethereum_file = "Ethereum_logs_individual.txt"
# tron_file = "WalletResourceUsage.txt"

# # Extract data from the files
# ethereum_default_gas_costs, ethereum_2x_gas_costs = extract_ethereum_data(ethereum_file)
# tron_wallet_a_trx_costs, tron_wallet_b_trx_costs = extract_tron_data(tron_file)

# # Convert TRX to ETH and USD for Tron Wallet A (Energy-Paying)
# tron_wallet_a_eth_costs = [trx * TRX_TO_ETH for trx in tron_wallet_a_trx_costs]
# tron_wallet_a_usd_costs = [trx * TRX_TO_USD for trx in tron_wallet_a_trx_costs]

# # Convert TRX to ETH and USD for Tron Wallet B (TRX-Paying)
# tron_wallet_b_eth_costs = [trx * TRX_TO_ETH for trx in tron_wallet_b_trx_costs]
# tron_wallet_b_usd_costs = [trx * TRX_TO_USD for trx in tron_wallet_b_trx_costs]

# # Convert ETH to USD for Ethereum costs
# ethereum_default_usd_costs = [eth * ETH_TO_USD for eth in ethereum_default_gas_costs]
# ethereum_2x_usd_costs = [eth * ETH_TO_USD for eth in ethereum_2x_gas_costs]

# # Comparison report generation
# comparison_report = ""

# # Compare Ethereum Default Gas Price with Tron Wallet A (Energy-Paying)
# comparison_report += "## Ethereum Default Gas Price vs Tron Wallet A (Energy-Paying) ##\n"
# for i in range(min(len(ethereum_default_gas_costs), len(tron_wallet_a_trx_costs))):
#     eth_cost_eth = ethereum_default_gas_costs[i]
#     eth_cost_usd = ethereum_default_usd_costs[i]
#     tron_cost_eth = tron_wallet_a_eth_costs[i]
#     tron_cost_usd = tron_wallet_a_usd_costs[i]
#     eth_vs_tron_eth = eth_cost_eth / tron_cost_eth if tron_cost_eth > 0 else float('inf')
#     eth_vs_tron_usd = eth_cost_usd / tron_cost_usd if tron_cost_usd > 0 else float('inf')
    
#     comparison_report += (
#         f"Ethereum Ether Used: {eth_cost_eth:.10f} ETH (${eth_cost_usd:.4f} USD)\n"
#         f"Tron TRX Used: {tron_wallet_a_trx_costs[i]:.6f} TRX ({tron_cost_eth:.10f} ETH, "
#         f"${tron_cost_usd:.4f} USD)\n"
#         f"Ethereum is {eth_vs_tron_eth:.2f}x more expensive than Tron in ETH\n"
#         f"Ethereum is {eth_vs_tron_usd:.2f}x more expensive than Tron in USD\n\n"
#     )

# # Compare Ethereum 2x Gas Price with Tron Wallet B (TRX-Paying)
# comparison_report += "## Ethereum 2x Gas Price vs Tron Wallet B (TRX-Paying) ##\n"
# for i in range(min(len(ethereum_2x_gas_costs), len(tron_wallet_b_trx_costs))):
#     eth_cost_eth = ethereum_2x_gas_costs[i]
#     eth_cost_usd = ethereum_2x_usd_costs[i]
#     tron_cost_eth = tron_wallet_b_eth_costs[i]
#     tron_cost_usd = tron_wallet_b_usd_costs[i]
#     eth_vs_tron_eth = eth_cost_eth / tron_cost_eth if tron_cost_eth > 0 else float('inf')
#     eth_vs_tron_usd = eth_cost_usd / tron_cost_usd if tron_cost_usd > 0 else float('inf')
    
#     comparison_report += (
#         f"Ethereum Ether Used: {eth_cost_eth:.10f} ETH (${eth_cost_usd:.4f} USD)\n"
#         f"Tron TRX Used: {tron_wallet_b_trx_costs[i]:.6f} TRX ({tron_cost_eth:.10f} ETH, "
#         f"${tron_cost_usd:.4f} USD)\n"
#         f"Ethereum is {eth_vs_tron_eth:.2f}x more expensive than Tron in ETH\n"
#         f"Ethereum is {eth_vs_tron_usd:.2f}x more expensive than Tron in USD\n\n"
#     )

# # Write the comparison report to a text file
# output_file = "comparison_report_cost.txt"
# with open(output_file, "w") as file:
#     file.write(comparison_report)

# print(f"Comparison report generated and saved as {output_file}")




# Conversion rates
trx_to_eth_rate = 0.000065  # 1 TRX = 0.000065 ETH
trx_to_usd_rate = 0.15      # 1 TRX = 0.15 USD
eth_to_usd_rate = 2354.12    # 1 ETH = 2338 USD

# Function to extract data from Ethereum logs
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
                    # Append to default gas lists
                    ethereum_default_eth_costs.append(eth_used)
                    ethereum_default_usd_costs.append(eth_cost_usd)
                else:
                    # Append to 2x gas lists
                    ethereum_2x_eth_costs.append(eth_used)
                    ethereum_2x_usd_costs.append(eth_cost_usd)
    
    return ethereum_default_eth_costs, ethereum_2x_eth_costs, ethereum_default_usd_costs, ethereum_2x_usd_costs

# Function to extract data from Tron logs (same as before)
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
                    if trx_used_str:
                        trx_used = float(trx_used_str)
                    else:
                        trx_used = 0.0
                except (IndexError, ValueError) as e:
                    trx_used = 0.0

                if is_wallet_a:
                    tron_wallet_a_trx_costs.append(trx_used)
                else:
                    tron_wallet_b_trx_costs.append(trx_used)
    
    return tron_wallet_a_trx_costs, tron_wallet_b_trx_costs

# File paths for Ethereum and Tron logs
ethereum_file = "Ethereum_logs_individual.txt"
tron_file = "WalletResourceUsage.txt"

# Extract Ethereum data
ethereum_default_eth_costs, ethereum_2x_eth_costs, ethereum_default_usd_costs, ethereum_2x_usd_costs = extract_ethereum_data(ethereum_file)

# Extract Tron data
tron_wallet_a_trx_costs, tron_wallet_b_trx_costs = extract_tron_data(tron_file)

# Summing up total costs for Ethereum and Tron Wallet A and B
total_ethereum_default_eth = sum(ethereum_default_eth_costs)
total_ethereum_2x_eth = sum(ethereum_2x_eth_costs)
total_tron_wallet_a_trx = sum(tron_wallet_a_trx_costs)
total_tron_wallet_b_trx = sum(tron_wallet_b_trx_costs)

# Convert to USD
total_ethereum_default_usd = sum(ethereum_default_usd_costs)
total_ethereum_2x_usd = sum(ethereum_2x_usd_costs)
total_tron_wallet_a_usd = total_tron_wallet_a_trx * trx_to_usd_rate
total_tron_wallet_b_usd = total_tron_wallet_b_trx * trx_to_usd_rate

# Comparison calculations
eth_vs_tron_a_usd_default = total_ethereum_default_usd / total_tron_wallet_a_usd if total_tron_wallet_a_usd > 0 else float('inf')
eth_vs_tron_b_usd_default = total_ethereum_default_usd / total_tron_wallet_b_usd if total_tron_wallet_b_usd > 0 else float('inf')

eth_vs_tron_a_usd_2x = total_ethereum_2x_usd / total_tron_wallet_a_usd if total_tron_wallet_a_usd > 0 else float('inf')
eth_vs_tron_b_usd_2x = total_ethereum_2x_usd / total_tron_wallet_b_usd if total_tron_wallet_b_usd > 0 else float('inf')

# Generate the consolidated report
consolidated_report = f"""
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
    file.write(consolidated_report)

print(f"Consolidated comparison report generated and saved as {output_file}")




