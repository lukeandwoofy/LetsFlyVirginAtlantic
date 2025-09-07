document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginDiv = document.getElementById('login');
    const mainDiv = document.getElementById('main');
    const tableBody = document.querySelector('#flightsTable tbody');
    const refreshBtn = document.getElementById('refresh');

    // Initialize map
    let map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Handle login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent form from reloading the page
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === 'admin' && password === 'password') {
            loginDiv.style.display = 'none';
            mainDiv.style.display = 'block';
            fetchFlights(); // Load flights after login
        } else {
            alert('Invalid username or password. Please try again.');
        }
    });

    // Handle refresh button
    refreshBtn.addEventListener('click', fetchFlights);

    // Fetch flight data from OpenSky API
    function fetchFlights() {
        fetch('https://opensky-network.org/api/states/all')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const states = data.states || [];
                const virginStates = states.filter(state => state[1] && state[1].trim().startsWith('VIR') && !state[8]);
                tableBody.innerHTML = ''; // Clear existing table rows
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer); // Clear existing markers
                    }
                });

                virginStates.forEach(state => {
                    const [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track] = state;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${callsign || 'N/A'}</td>
                        <td>${latitude ? latitude.toFixed(4) : 'N/A'}</td>
                        <td>${longitude ? longitude.toFixed(4) : 'N/A'}</td>
                        <td>${baro_altitude ? (baro_altitude * 3.28084).toFixed(0) : 'N/A'}</td>
                        <td>${velocity ? velocity.toFixed(0) : 'N/A'}</td>
                        <td>${true_track ? true_track.toFixed(0) : 'N/A'}</td>
                    `;
                    tableBody.appendChild(row);
                    if (latitude && longitude) {
                        L.marker([latitude, longitude]).addTo(map)
                            .bindPopup(`Callsign: ${callsign || 'N/A'}<br>Altitude: ${baro_altitude ? (baro_altitude * 3.28084).toFixed(0) : 'N/A'} ft`);
                    }
                });

                if (virginStates.length > 0) {
                    const bounds = virginStates
                        .map(s => [s[6], s[5]])
                        .filter(pos => pos[0] && pos[1]);
                    if (bounds.length > 0) {
                        map.fitBounds(bounds);
                    }
                } else {
                    map.setView([0, 0], 2);
                    alert('No Virgin Atlantic flights currently detected.');
                }
            })
            .catch(error => {
                console.error('Error fetching flight data:', error);
                alert('Error loading flight data. Please try again later.');
            });
    }
});
