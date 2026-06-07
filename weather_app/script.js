// API layer
const weatherAPI = {
  baseURL: "https://api.open-meteo.com/v1/forecast",
  geoURL: "https://geocoding-api.open-meteo.com/v1/search",

  async searchCity(cityName) {
    try {
      const response = await fetch(
        `${this.geoURL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error("City not found");
      }

      return data.results[0];
    } catch (error) {
      throw new Error(`Failed to search city: ${error.message}`);
    }
  },

  async getWeather(latitude, longitude) {
    try {
      const response = await fetch(
        `${this.baseURL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,precipitation,weather_code`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.current_weather;
    } catch (error) {
      throw new Error(`Failed to fetch weather: ${error.message}`);
    }
  },
};

// UI layer
const ui = {
  // Elements
  elements: {
    cityInput: document.getElementById("cityInput"),
    searchBtn: document.getElementById("searchBtn"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    errorMessage: document.getElementById("errorMessage"),
    weatherInfo: document.getElementById("weatherInfo"),
    cityName: document.getElementById("cityName"),
    weatherDesc: document.getElementById("weatherDesc"),
    temperature: document.getElementById("temperature"),
    humidity: document.getElementById("humidity"),
    windSpeed: document.getElementById("windSpeed"),
    pressure: document.getElementById("pressure"),
    historyList: document.getElementById("historyList"),
  },

  showLoading() {
    this.elements.loading.classList.remove("hidden");
    this.elements.error.classList.add("hidden");
    this.elements.weatherInfo.classList.add("hidden");
  },

  hideLoading() {
    this.elements.loading.classList.add("hidden");
  },

  showError(message) {
    this.elements.errorMessage.textContent = `❌ ${message}`;
    this.elements.error.classList.remove("hidden");
    this.elements.weatherInfo.classList.add("hidden");
    this.elements.loading.classList.add("hidden");
  },

  displayWeather(city, weather) {
    this.elements.cityName.textContent =
      city.name + (city.admin1 ? `, ${city.admin1}` : "");

    // Weather description based on weather code
    const weatherDesc = this.getWeatherDescription(weather.weather_code);
    this.elements.weatherDesc.textContent = weatherDesc;

    this.elements.temperature.textContent = `${weather.temperature}°C`;
    this.elements.windSpeed.textContent = `${weather.wind_speed} km/h`;
    this.elements.humidity.textContent = "N/A";
    this.elements.pressure.textContent = "N/A";

    this.elements.weatherInfo.classList.remove("hidden");
    this.elements.error.classList.add("hidden");
    this.elements.loading.classList.add("hidden");
  },

  getWeatherDescription(code) {
    // WMO Weather interpretation codes
    const descriptions = {
      0: "☀️ Clear sky",
      1: "🌤️ Mainly clear",
      2: "⛅ Partly cloudy",
      3: "☁️ Overcast",
      45: "🌫️ Foggy",
      48: "🌫️ Depositing rime fog",
      51: "🌧️ Light drizzle",
      53: "🌧️ Moderate drizzle",
      55: "🌧️ Dense drizzle",
      61: "🌧️ Slight rain",
      63: "🌧️ Moderate rain",
      65: "🌧️ Heavy rain",
      71: "❄️ Slight snow",
      73: "❄️ Moderate snow",
      75: "❄️ Heavy snow",
      80: "🌧️ Slight rain showers",
      81: "🌧️ Moderate rain showers",
      82: "🌧️ Violent rain showers",
      85: "❄️ Slight snow showers",
      86: "❄️ Heavy snow showers",
      95: "⛈️ Thunderstorm",
    };
    return descriptions[code] || "🌤️ Unknown";
  },

  clearInput() {
    this.elements.cityInput.value = "";
  },

  updateHistory(cities) {
    const historyList = this.elements.historyList;

    if (cities.length === 0) {
      historyList.innerHTML =
        '<p class="no-history">Chưa có lịch sử tìm kiếm</p>';
      return;
    }

    historyList.innerHTML = cities
      .map(
        (city) =>
          `<div class="history-item" onclick="app.searchFromHistory('${city}')">${city}</div>`,
      )
      .join("");
  },
};

// App controller
const app = {
  history: [],
  maxHistory: 5,

  init() {
    this.loadHistory();
    this.ui = ui;
    this.api = weatherAPI;

    ui.elements.searchBtn.addEventListener("click", () => this.search());
    ui.elements.cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.search();
    });

    ui.updateHistory(this.history);
  },

  async search() {
    const cityName = ui.elements.cityInput.value.trim();

    if (!cityName) {
      ui.showError("Vui lòng nhập tên thành phố");
      return;
    }

    ui.showLoading();

    try {
      // Search city
      const city = await this.api.searchCity(cityName);

      // Get weather
      const weather = await this.api.getWeather(city.latitude, city.longitude);

      // Display
      ui.displayWeather(city, weather);

      // Update history
      this.addToHistory(city.name);

      ui.clearInput();
    } catch (error) {
      ui.showError(error.message);
    } finally {
      ui.hideLoading();
    }
  },

  searchFromHistory(cityName) {
    ui.elements.cityInput.value = cityName;
    this.search();
  },

  addToHistory(cityName) {
    // Remove if already exists
    this.history = this.history.filter((c) => c !== cityName);

    // Add to beginning
    this.history.unshift(cityName);

    // Keep only max items
    this.history = this.history.slice(0, this.maxHistory);

    this.saveHistory();
    ui.updateHistory(this.history);
  },

  saveHistory() {
    localStorage.setItem("weatherHistory", JSON.stringify(this.history));
  },

  loadHistory() {
    const saved = localStorage.getItem("weatherHistory");
    this.history = saved ? JSON.parse(saved) : [];
  },
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
