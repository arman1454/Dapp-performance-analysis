# Python script to compare Ethereum and Tron results with dual TPS/Latency scenarios
def extract_values_from_file(file_path):
    tps_values = []
    latency_values = []

    with open(file_path, "r") as file:
        for line in file:
            # Extract TPS value
            if "Throughput (TPS)" in line:
                # Split at the space before "at" and convert to float
                tps = float(line.split(": ")[1].split(" ")[0])
                tps_values.append(tps)
            # Extract Latency value
            elif "Average Latency" in line:
                latency = float(line.split(": ")[1].replace("s", "").strip())
                latency_values.append(latency)

    return tps_values, latency_values


def compare_values(eth_values, tron_values, scenario):
    eth_tps, eth_latency = eth_values
    tron_tps, tron_latency = tron_values

    tps_comparison = tron_tps / eth_tps if eth_tps > 0 else float('inf')
    latency_comparison = eth_latency / tron_latency if tron_latency > 0 else float('inf')

    comparison_text = f"\n## {scenario} ##\n"
    comparison_text += f"Ethereum TPS: {eth_tps}, Tron TPS: {tron_tps}\n"
    comparison_text += f"Ethereum Latency: {eth_latency}s, Tron Latency: {tron_latency}s\n"
    comparison_text += f"Tron TPS is {tps_comparison:.2f}x faster than Ethereum\n"
    comparison_text += f"Ethereum Latency is {latency_comparison:.2f}x slower than Tron\n"
    
    return comparison_text

def main():
    # File paths
    eth_file = 'Eth_TPS&AvgLatency_log.txt'
    tron_file = 'Tron_TPS&AvgLatency_log.txt'
    
    # Extract values from both files
    eth_tps_values, eth_latency_values = extract_values_from_file(eth_file)
    tron_tps_values, tron_latency_values = extract_values_from_file(tron_file)
    
    # Ensure we have 2 TPS and Latency values from each file
    if len(eth_tps_values) < 2 or len(eth_latency_values) < 2 or len(tron_tps_values) < 2 or len(tron_latency_values) < 2:
        print("Error: Not enough TPS or Latency values to compare.")
        return

    # Comparison results
    comparison_results = ""
    
    # Scenario 1: Ethereum Default Gas Price vs Tron Wallet A (Energy)
    comparison_results += compare_values(
        (eth_tps_values[0], eth_latency_values[0]),
        (tron_tps_values[0], tron_latency_values[0]),
        "Ethereum Default Gas Price vs Tron Wallet A (Energy)"
    )
    
    # Scenario 2: Ethereum 2x Gas Price vs Tron Wallet B (TRX)
    comparison_results += compare_values(
        (eth_tps_values[1], eth_latency_values[1]),
        (tron_tps_values[1], tron_latency_values[1]),
        "Ethereum 2x Gas Price vs Tron Wallet B (TRX)"
    )
    
    # Write results to Comparison_Result.txt
    with open("Comparison_Result.txt", "w") as result_file:
        result_file.write(comparison_results)
    
    print("Comparison analysis complete! Check the 'Comparison_Result.txt' file.")

if __name__ == "__main__":
    main()