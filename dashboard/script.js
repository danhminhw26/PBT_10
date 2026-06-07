// API Layer
const apis = {
  baseURLs: {
    jsonplaceholder: "https://jsonplaceholder.typicode.com",
    weather: "https://api.open-meteo.com/v1/forecast",
    countries: "https://restcountries.com/v3.1/name/vietnam",
    dogs: "https://dog.ceo/api/breeds/image/random/5",
  },

  async getUsers() {
    const response = await fetch(
      `${this.baseURLs.jsonplaceholder}/users?_limit=5`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getWeather() {
    const response = await fetch(
      `${this.baseURLs.weather}?latitude=21.03&longitude=105.85&current_weather=true`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getCountry() {
    const response = await fetch(this.baseURLs.countries);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },

  async getDogs() {
    const response = await fetch(this.baseURLs.dogs);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.message; // Array of dog image URLs
  },

  async getPosts() {
    const response = await fetch(
      `${this.baseURLs.jsonplaceholder}/posts?_limit=5`,
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
};

// UI Layer
const ui = {
  elements: {
    dashboard: document.getElementById("dashboard"),
    refreshBtn: document.getElementById("refreshBtn"),
    loadTime: document.getElementById("loadTime"),
  },

  renderWidget(
    title,
    content,
    isLoading = false,
    isError = false,
    errorMsg = "",
  ) {
    const statusClass = isLoading ? "loading" : isError ? "error" : "";
    const statusText = isLoading ? "Loading..." : isError ? "Error" : "Success";

    return `
            <div class="widget ${statusClass}">
                <div class="widget-header">
                    <div class="widget-title">${title}</div>
                    <div class="widget-status ${statusClass}">${statusText}</div>
                </div>
                <div class="widget-content">
                    ${
                      isLoading
                        ? `
                        <div class="loading-content">
                            <div class="widget-spinner"></div>
                            <span>Loading...</span>
                        </div>
                    `
                        : isError
                          ? `
                        <div class="error-content">
                            <div class="error-icon">❌</div>
                            <div>${errorMsg}</div>
                        </div>
                    `
                          : content
                    }
                </div>
            </div>
        `;
  },

  renderUsers(users) {
    const html = users
      .map(
        (user) => `
            <div class="user-item">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                </div>
            </div>
        `,
      )
      .join("");

    return `<div class="users-list">${html}</div>`;
  },

  renderWeather(weatherData) {
    const weather = weatherData.current_weather;
    return `
            <div class="weather-content">
                <div class="weather-temp">${weather.temperature}°C</div>
                <div class="weather-desc">Hà Nội, Việt Nam</div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <div class="weather-detail-label">Gió</div>
                        <div class="weather-detail-value">${weather.wind_speed} km/h</div>
                    </div>
                    <div class="weather-detail">
                        <div class="weather-detail-label">Hướng gió</div>
                        <div class="weather-detail-value">${weather.wind_direction}°</div>
                    </div>
                </div>
            </div>
        `;
  },

  renderCountry(countries) {
    const country = countries[0];
    return `
            <div class="country-info">
                <div class="country-flag">${country.flag}</div>
                <p><strong>Tên:</strong> <span>${country.name.common}</span></p>
                <p><strong>Thủ đô:</strong> <span>${country.capital?.[0] || "N/A"}</span></p>
                <p><strong>Diện tích:</strong> <span>${country.area?.toLocaleString()} km²</span></p>
                <p><strong>Dân số:</strong> <span>${country.population?.toLocaleString()}</span></p>
            </div>
        `;
  },

  renderDogs(dogUrls) {
    const html = dogUrls
      .map(
        (url) => `
            <img src="${url}" alt="dog" class="dog-image" onclick="window.open('${url}')">
        `,
      )
      .join("");

    return `<div class="dogs-grid">${html}</div>`;
  },

  renderPosts(posts) {
    const html = posts
      .map(
        (post) => `
            <div class="post-item">
                <div class="post-title">${post.title}</div>
                <div class="post-meta">User #${post.userId} • Post #${post.id}</div>
            </div>
        `,
      )
      .join("");

    return `<div class="posts-list">${html}</div>`;
  },
};

// Dashboard Controller
const dashboard = {
  init() {
    ui.elements.refreshBtn.addEventListener("click", () =>
      this.loadDashboard(),
    );
    this.loadDashboard();
  },

  async loadDashboard() {
    const startTime = Date.now();
    ui.elements.dashboard.innerHTML = "";

    // Show loading state
    ui.elements.dashboard.innerHTML = `
            ${ui.renderWidget("👥 Users", "", true)}
            ${ui.renderWidget("🌤️ Weather", "", true)}
            ${ui.renderWidget("🌍 Country Info", "", true)}
            ${ui.renderWidget("🐕 Dogs", "", true)}
            ${ui.renderWidget("📝 Recent Posts", "", true)}
        `;

    // Load all APIs in parallel using Promise.allSettled
    const results = await Promise.allSettled([
      apis.getUsers(),
      apis.getWeather(),
      apis.getCountry(),
      apis.getDogs(),
      apis.getPosts(),
    ]);

    const endTime = Date.now();
    const loadTime = endTime - startTime;
    ui.elements.loadTime.textContent = `${loadTime}ms`;

    // Render each widget based on result
    const widgets = [
      {
        title: "👥 Users",
        render: (data) => ui.renderUsers(data),
      },
      {
        title: "🌤️ Weather",
        render: (data) => ui.renderWeather(data),
      },
      {
        title: "🌍 Country Info",
        render: (data) => ui.renderCountry(data),
      },
      {
        title: "🐕 Dogs",
        render: (data) => ui.renderDogs(data),
      },
      {
        title: "📝 Recent Posts",
        render: (data) => ui.renderPosts(data),
      },
    ];

    let html = "";
    results.forEach((result, index) => {
      const widget = widgets[index];

      if (result.status === "fulfilled") {
        html += ui.renderWidget(
          widget.title,
          widget.render(result.value),
          false,
          false,
        );
      } else {
        html += ui.renderWidget(
          widget.title,
          "",
          false,
          true,
          result.reason.message || "Failed to load",
        );
      }
    });

    ui.elements.dashboard.innerHTML = html;
  },
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  dashboard.init();
});
