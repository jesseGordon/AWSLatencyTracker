console.log('app.js loaded');

let map;
let markers = {};

function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function getLatencyColor(latency) {
    if (latency === null) return '#808080';
    if (latency < 1) return '#00ff00';
    if (latency < 10) return '#80ff00';
    if (latency < 100) return '#ffff00';
    if (latency < 1000) return '#ffa500';
    return '#ff0000';
}

function updateMarkers(regions, latencyData) {
    console.log('Updating markers with data:', { regions, latencyData });
    regions.forEach(region => {
        const latency = latencyData[region.code];
        const color = getLatencyColor(latency);
        
        if (markers[region.code]) {
            markers[region.code].setStyle({ fillColor: color, color: color });
            markers[region.code].setTooltipContent(`${region.name}<br>Latency: ${latency ? latency + ' ms' : 'N/A'}`);
        } else {
            const marker = L.circleMarker([region.lat, region.lon], {
                radius: 8,
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);
            
            marker.bindTooltip(`${region.name}<br>Latency: ${latency ? latency + ' ms' : 'N/A'}`);
            markers[region.code] = marker;

            marker.on('click', () => {
                fetchTraceroute(region.code);
            });
        }
    });
}

function updateLatencyTable(latencyData) {
    console.log('Updating latency table with data:', latencyData);
    const tableBody = document.querySelector('#latency-data tbody');
    tableBody.innerHTML = '';
    
    const sortedData = Object.entries(latencyData)
        .map(([region, latency]) => ({ region, latency }))
        .sort((a, b) => {
            if (a.latency === null) return 1;
            if (b.latency === null) return -1;
            return a.latency - b.latency;
        });

    sortedData.forEach(({ region, latency }) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = region;
        row.insertCell(1).textContent = latency ? `${latency} ms` : 'N/A';
    });
}

function fetchTraceroute(regionCode) {
    fetch(`/api/traceroute/${regionCode}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(tracerouteData => {
            console.log('Fetched traceroute data:', tracerouteData);
            displayTraceroute(regionCode, tracerouteData);
        })
        .catch(error => {
            console.error('Error fetching traceroute data:', error);
            document.getElementById('error-message').textContent = `Error fetching traceroute data: ${error.message}`;
        });
}

function displayTraceroute(regionCode, tracerouteData) {
    const traceroutePanel = document.getElementById('traceroute-panel');
    traceroutePanel.innerHTML = `<h3>Traceroute to ${regionCode}</h3>`;
    
    if (tracerouteData && tracerouteData.length > 0) {
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Hop</th>
                    <th>IP</th>
                    <th>RTT (ms)</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        tracerouteData.forEach(hop => {
            const row = tbody.insertRow();
            row.insertCell(0).textContent = hop.hop;
            row.insertCell(1).textContent = hop.ip;
            row.insertCell(2).textContent = hop.rtt !== null ? `${hop.rtt.toFixed(2)} ms` : '*';
        });
        
        traceroutePanel.appendChild(table);
    } else {
        traceroutePanel.innerHTML += '<p>No traceroute data available.</p>';
    }
}

function fetchData() {
    console.log('fetchData called');
    Promise.all([
        fetch('/api/regions').then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }),
        fetch('/api/latency').then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
    ]).then(([regions, latencyData]) => {
        console.log('Fetched regions:', regions);
        console.log('Fetched latency data:', latencyData);
        updateMarkers(regions, latencyData);
        updateLatencyTable(latencyData);
        document.getElementById('error-message').textContent = '';
    }).catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('error-message').textContent = `Error fetching data: ${error.message}`;
    });
}

window.onerror = function(message, source, lineno, colno, error) {
    console.error('Uncaught error:', error);
    document.getElementById('error-message').textContent = `Uncaught error: ${message}`;
    return true;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    console.log('Leaflet version:', L.version);
    initMap();
    fetchData();
    setInterval(fetchData, 2000); // Update every 2 seconds
});
