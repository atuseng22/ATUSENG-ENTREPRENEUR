// OpenWeatherMap API Key (Free API)
// Sign up at: https://openweathermap.org/api
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your API key

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const lastUpdated = document.getElementById('lastUpdated');

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    } else {
        showError('Please enter a city name');
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Fetch Weather Data
async function fetchWeather(city) {
    try {
        showError(''); // Clear error message

        if (API_KEY === 'YOUR_API_KEY_HERE') {
            showError('⚠️ Please add your OpenWeatherMap API key to script.js');
            return;
        }

        // Fetch current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            throw new Error('City not found');
        }

        const weatherData = await weatherResponse.json();

        // Fetch forecast data
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );

        const forecastData = await forecastResponse.json();

        // Display data
        displayCurrentWeather(weatherData);
        displayForecast(forecastData);
        updateLastUpdated();

    } catch (error) {
        showError(`Error: ${error.message}`);
        console.error('Weather fetch error:', error);
    }
}

// Display Current Weather
function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds, visibility } = data;

    // Basic Info
    document.getElementById('cityName').textContent = `${name}, ${sys.country}`;
    document.getElementById('temperature').textContent = `${Math.round(main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = weather[0].description;

    // Weather Icon
    const iconCode = weather[0].icon;
    document.getElementById('weatherIcon').src = 
        `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    // Details
    document.getElementById('feelsLike').textContent = `${Math.round(main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${wind.speed} m/s`;
    document.getElementById('pressure').textContent = `${main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
    document.getElementById('uvIndex').textContent = `${Math.round(clouds.all)}%`;
}

// Display 5-Day Forecast
function displayForecast(data) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    const uniqueDays = new Set();
    const forecasts = [];

    // Get one forecast per day (at 12:00 PM)
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString();

        if (!uniqueDays.has(day) && uniqueDays.size < 5) {
            uniqueDays.add(day);
            forecasts.push(item);
        }
    });

    // Create forecast cards
    forecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const temp = Math.round(forecast.main.temp);
        const icon = forecast.weather[0].icon;
        const description = forecast.weather[0].main;

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" class="icon">
            <div class="temp">${temp}°C</div>
            <div class="desc">${description}</div>
        `;

        forecastContainer.appendChild(forecastItem);
    });
}

// Update Last Updated Time
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    lastUpdated.textContent = timeString;
}

// Show Error Message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.toggle('show', message !== '');
}

// Load default city on page load
window.addEventListener('load', () => {
    fetchWeather('London');
});
