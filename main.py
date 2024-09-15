from flask import Flask, render_template, jsonify
import json
import time
import threading
import logging
import socket

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Load AWS regions data
with open('aws_regions.json', 'r') as f:
    aws_regions = json.load(f)

latency_data = {}

def tcp_ping(host, port=80, timeout=2):
    try:
        start_time = time.time()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        if result == 0:
            return time.time() - start_time
        else:
            return None
    except socket.error:
        return None
    finally:
        sock.close()

def update_latency():
    while True:
        logging.info("Starting latency update...")
        for region in aws_regions:
            try:
                latency = tcp_ping(region['endpoint'])
                if latency is not None:
                    latency_data[region['code']] = round(latency * 1000, 2)  # Convert to ms
                    logging.info(f"Region: {region['code']}, Latency: {latency_data[region['code']]} ms")
                else:
                    latency_data[region['code']] = None
                    logging.info(f"Region: {region['code']}, Latency: None")
            except Exception as e:
                latency_data[region['code']] = None
                logging.error(f"Error pinging {region['code']}: {str(e)}")
        time.sleep(2)  # Update every 2 seconds

# Start the latency update thread
threading.Thread(target=update_latency, daemon=True).start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/latency')
def get_latency():
    return jsonify(latency_data)

@app.route('/api/regions')
def get_regions():
    return jsonify(aws_regions)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5012)
