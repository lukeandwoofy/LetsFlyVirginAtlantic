document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded'); // Debug: Confirm script runs

    const loginForm = document.getElementById('loginForm');
    const loginDiv = document.getElementById('login');
    const mainDiv = document.getElementById('main');
    const tableBody = document.querySelector('#flightsTable tbody');
    const refreshBtn = document.getElementById('refresh');

    // Check if elements are found
    if (!loginForm || !loginDiv || !mainDiv || !tableBody || !refreshBtn) {
        console.error('One or more elements not found:', { loginForm, loginDiv, mainDiv, tableBody, refreshBtn });
        alert('Error: Page elements not found. Check console for details.');
        return;
    }

    // Handle login
    loginForm.addEventListener('submit', (e) => {
        console.log('Login form submitted'); // Debug: Confirm submission
        e.preventDefault(); // Prevent page reload
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === 'admin' && password === 'password') {
            console.log('Login successful'); // Debug
            loginDiv.style.display = 'none';
            mainDiv.style.display = 'block';
            initializeMap(); // Initialize map after login
            fetchFlights(); // Load flights
        } else {
            console.log('Login failed: Invalid credentials'); // Debug
            alert('Invalid username or password. Use "admin" and "password".');
        }
    });

    // Handle refresh button
    refreshBtn.addEventListener('click', () => {
        console.log('Refresh button clicked'); // Debug
        fetchFlights();
    });

    // Initialize map
    let map;
    function initializeMap() {
        console.log('Initializing map'); // Debug
        map = L.map('map').setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    // Fetch flight data
    function fetchFlights() {
        console.log('Fetching flights'); // Debug
        fetch('https://opensky-network.org/api/states/all')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Flight data received:', data); // Debug
                const states = data.states || [];
                const virginStates = states.filter(state => state[1] && state[1].trim().startsWith('VIR') && !state[8]);
                tableBody.innerHTML = ''; // Clear table
                if (map) {
                    map.eachLayer(layer => {
                        if (layer instanceof L.Marker) {
                            map.removeLayer(layer); // Clear markers
                        }
                    });
                }

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
                    if (latitude && longitude && map) {
                        L.marker([latitude, longitude]).addTo(map)
                            .bindPopup(`Callsign: ${callsign || 'N/A'}<br>Altitude: ${baro_altitude ? (baro_altitude * 3.28084).toFixed(0) : 'N/A'} ft`);
                    }
                });

                if (virginStates.length > 0 && map) {
                    const bounds = virginStates
                        .map(s => [s[6], s[5]])
                        .filter(pos => pos[0] && pos[1]);
                    if (bounds.length > 0) {
                        map.fitBounds(bounds);
                    }
                } else {
                    console.log('No Virgin Atlantic flights found'); // Debug
                    if (map) map.setView([0, 0], 2);
                    alert('No Virgin Atlantic flights currently detected.');
                }
            })
            .catch(error => {
                console.error('Error fetching flight data:', error);
                alert('Error loading flight data. Please try again later.');
            });
    }
});
