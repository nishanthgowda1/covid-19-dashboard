// API Base URL
const API_BASE_URL = 'https://disease.sh/v3/covid-19';

// DOM Elements
const globalConfirmed = document.getElementById('global-confirmed');
const globalActive = document.getElementById('global-active');
const globalRecovered = document.getElementById('global-recovered');
const globalDeaths = document.getElementById('global-deaths');
const countrySelect = document.getElementById('country-select');
const countryStatsEl = document.getElementById('country-stats');
const ctx = document.getElementById('historicalChart').getContext('2d');

// Chart.js instance (initially empty)
let myChart;

// 1. Fetch Global Data and Populate Cards
function fetchGlobalData() {
    fetch(`${API_BASE_URL}/all`)
        .then(response => response.json())
        .then(data => {
            globalConfirmed.textContent = data.cases.toLocaleString();
            globalActive.textContent = data.active.toLocaleString();
            globalRecovered.textContent = data.recovered.toLocaleString();
            globalDeaths.textContent = data.deaths.toLocaleString();
        })
        .catch(error => {
            console.error("Error fetching global data:", error);
            globalConfirmed.textContent = "Error";
        });
}

// 2. Fetch List of Countries and Populate Dropdown
function fetchCountries() {
    fetch(`${API_BASE_URL}/countries`)
        .then(response => response.json())
        .then(data => {
            // Sort countries alphabetically
            data.sort((a, b) => a.country.localeCompare(b.country));

            // Create an option for each country
            data.forEach(country => {
                const option = document.createElement('option');
                option.value = country.countryInfo.iso3; // Use ISO3 code for API calls
                option.textContent = country.country;
                countrySelect.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching countries:", error));
}

// 3. Fetch Data for a Specific Country (or Global) and Update Cards/Chart
function fetchCountryData(countryCode = 'all') {
    // Show loading state
    countryStatsEl.innerHTML = '<p>Loading country data...</p>';

    // Fetch current country data
    fetch(`${API_BASE_URL}/countries/${countryCode}`)
        .then(response => response.json())
        .then(data => {
            // Update the country stats cards
            updateCountryStats(data);
            // Now fetch historical data for the chart
            return fetchHistoricalData(countryCode);
        })
        .then(historicalData => {
            // Update the chart with the new historical data
            updateChart(historicalData);
        })
        .catch(error => {
            console.error("Error fetching country data:", error);
            countryStatsEl.innerHTML = '<p>Failed to load data.</p>';
        });
}

// Helper function to update the country stats cards
function updateCountryStats(data) {
    const countryName = data.country || 'Global';
    countryStatsEl.innerHTML = `
        <div class="stat-card confirmed">
            <h3>Confirmed in ${countryName}</h3>
            <p>${data.cases.toLocaleString()}</p>
        </div>
        <div class="stat-card active">
            <h3>Active in ${countryName}</h3>
            <p>${data.active.toLocaleString()}</p>
        </div>
        <div class="stat-card recovered">
            <h3>Recovered in ${countryName}</h3>
            <p>${data.recovered.toLocaleString()}</p>
        </div>
        <div class="stat-card deaths">
            <h3>Deaths in ${countryName}</h3>
            <p>${data.deaths.toLocaleString()}</p>
        </div>
    `;
}

// 4. Fetch Historical Data for Charts
function fetchHistoricalData(countryCode = 'all') {
    // 'lastdays=30' gets data for the past 30 days
    return fetch(`${API_BASE_URL}/historical/${countryCode}?lastdays=30`)
        .then(response => response.json())
        .then(data => {
            // The API returns data differently for 'all' vs a specific country
            if (countryCode === 'all') {
                return data; // { cases: {...}, deaths: {...}, recovered: {...} }
            } else {
                return data.timeline; // { cases: {...}, deaths: {...}, recovered: {...} }
            }
        });
}

// 5. Create or Update the Chart using Chart.js
function updateChart(historicalData) {
    // Prepare the data for the chart
    const dates = Object.keys(historicalData.cases);
    const cases = Object.values(historicalData.cases);
    const deaths = Object.values(historicalData.deaths);
    const recovered = Object.values(historicalData.recovered);

    const chartData = {
        labels: dates,
        datasets: [
            {
                label: 'Cases',
                data: cases,
                borderColor: 'rgb(231, 76, 60)',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                tension: 0.3 // Makes the line slightly curved
            },
            {
                label: 'Deaths',
                data: deaths,
                borderColor: 'rgb(127, 140, 141)',
                backgroundColor: 'rgba(127, 140, 141, 0.2)',
                tension: 0.3
            },
            {
                label: 'Recovered',
                data: recovered,
                borderColor: 'rgb(46, 204, 113)',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                tension: 0.3
            }
        ]
    };

    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'COVID-19 Trends Over Last 30 Days' }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    // If a chart already exists, destroy it before creating a new one
    if (myChart) {
        myChart.destroy();
    }
    // Create the new chart
    myChart = new Chart(ctx, config);
}

// 6. Event Listener for Country Select Dropdown
countrySelect.addEventListener('change', (e) => {
    const selectedCountryCode = e.target.value;
    fetchCountryData(selectedCountryCode);
});

// 7. Initialize the App when the page loads
function initApp() {
    fetchGlobalData();
    fetchCountries();
    fetchCountryData('all'); // Start by showing global historical data
}

// Start everything!
initApp();
