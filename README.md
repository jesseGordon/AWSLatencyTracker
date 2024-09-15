# AWS Latency Tracker
AWS Latency Tracker is a simple tool to monitor the latency of all AWS regions. To use, simply run the main script and open your browser to port 5012.
Or run it in a cloudhosted environment and see how much quicker it is to access AWS regions from the backbone.

## Usage

1. Run the main script:
    ```sh
    python main.py
    ```
2. Open your browser and go to `http://localhost:5012` to view the latency dashboard.

## Understanding the Dashboard
* Latency Metrics - view the current latency (in milliseconds) for each AWS region.
* Region Comparison - easily compare latencies between multiple AWS regions to make informed decisions about your deployments.
