let todaysRecord;
// fetch data from json file
async function fetchAllRecords() {
  const response = await fetch("data/today.json");
  if (!response.ok) throw new Error("Network response was not ok");
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error("No records found");

  data[14].state_name = data[14].state_name.replace(/\*+/, ""); // clean value
  todaysRecord = data;
}

function getWatchlist() {
  return JSON.parse(window.localStorage.getItem("watchList")) || [];
}
function updateWatchlist(watchList) {
  window.localStorage.setItem("watchList", JSON.stringify(watchList));
}

// COVID-19 Dashboard Application
class CovidDashboard {
  constructor() {
    // Initialize data from the provided JSON
    this.countryData = {};
    this.statesData = [];

    // Initialize watchlist
    this.watchlist = getWatchlist();
    this.maxWatchlistItems = 5;

    // Initialize the dashboard
    this.init();
  }

  init() {
    // load data
    this.countryData = todaysRecord.pop();
    this.statesData = todaysRecord;
    // Wait for DOM to be fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeComponents();
      });
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    // Render all components
    this.renderCountrySummary();
    this.populateStateSelect();
    this.renderTopPerformers();
    this.renderDeathsList();
    this.renderWatchlist();
    this.bindEvents();
    this.updateLastUpdated();
  }

  renderCountrySummary() {
    // Display country-level data
    const country = this.countryData;

    // Elements for totals
    const countryConfirmedEl = document.getElementById("countryConfirmed");
    const countryActiveEl = document.getElementById("countryActive");
    const countryRecoveredEl = document.getElementById("countryRecovered");
    const countryDeathsEl = document.getElementById("countryDeaths");

    // Elements for deltas
    const countryConfirmedDeltaEl = document.getElementById("countryConfirmedDelta");
    const countryActiveDeltaEl = document.getElementById("countryActiveDelta");
    const countryRecoveredDeltaEl = document.getElementById("countryRecoveredDelta");
    const countryDeathsDeltaEl = document.getElementById("countryDeathsDelta");

    // Calculate deltas
    const confirmedDelta = country.new_positive - country.positive;
    const activeDelta = country.new_active - country.active;
    const recoveredDelta = country.new_cured - country.cured;
    const deathsDelta = country.new_death - country.death;

    // Helper to format delta
    const formatDelta = (delta) => {
      if (typeof delta !== "number" || isNaN(delta)) return "";
      if (delta > 0) return `(+${delta})`;
      if (delta < 0) return `(${delta})`;
      return "(0)";
    };

    if (countryConfirmedEl)
      countryConfirmedEl.childNodes[0].textContent = this.formatNumberWithCommas(country.new_positive) + " ";
    if (countryConfirmedDeltaEl) countryConfirmedDeltaEl.textContent = formatDelta(confirmedDelta);

    if (countryActiveEl)
      countryActiveEl.childNodes[0].textContent = this.formatNumberWithCommas(country.new_active) + " ";
    if (countryActiveDeltaEl) countryActiveDeltaEl.textContent = formatDelta(activeDelta);

    if (countryRecoveredEl)
      countryRecoveredEl.childNodes[0].textContent = this.formatNumberWithCommas(country.new_cured) + " ";
    if (countryRecoveredDeltaEl) countryRecoveredDeltaEl.textContent = formatDelta(recoveredDelta);

    if (countryDeathsEl)
      countryDeathsEl.childNodes[0].textContent = this.formatNumberWithCommas(country.new_death) + " ";
    if (countryDeathsDeltaEl) countryDeathsDeltaEl.textContent = formatDelta(deathsDelta);
  }

  populateStateSelect() {
    const select = document.getElementById("stateSelect");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Add State to Watchlist";
    select.appendChild(defaultOption);

    // Add state options
    this.statesData
      .sort((a, b) => a.state_name.localeCompare(b.state_name))
      .forEach((state) => {
        const option = document.createElement("option");
        option.value = state.state_name;
        option.textContent = state.state_name;
        select.appendChild(option);
      });
  }

  bindEvents() {
    // Add state to watchlist
    const addBtn = document.getElementById("addStateBtn");
    if (addBtn) {
      addBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.addToWatchlist();
      });
    }

    // Refresh data
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.refreshData();
      });
    }

    // Sort deaths list
    const deathsSort = document.getElementById("deathsSort");
    if (deathsSort) {
      deathsSort.addEventListener("change", (e) => {
        this.renderDeathsList(e.target.value);
      });
    }
  }

  addToWatchlist() {
    const select = document.getElementById("stateSelect");
    if (!select) return;

    const selectedState = select.value;

    if (!selectedState) {
      alert("Please select a state to add to your watchlist.");
      return;
    }

    if (this.watchlist.length >= this.maxWatchlistItems) {
      alert(`You can only track up to ${this.maxWatchlistItems} states in your watchlist.`);
      return;
    }

    if (this.watchlist.includes(selectedState)) {
      alert("This state is already in your watchlist.");
      return;
    }

    this.watchlist.push(selectedState);
    updateWatchlist(this.watchlist);
    this.renderWatchlist();
    select.value = "";
  }

  removeFromWatchlist(stateName) {
    this.watchlist = this.watchlist.filter((state) => state !== stateName);
    updateWatchlist(this.watchlist);
    this.renderWatchlist();
  }

  renderWatchlist() {
    const watchlistGrid = document.getElementById("watchlistGrid");
    const watchlistCounter = document.getElementById("watchlistCounter");

    if (!watchlistGrid || !watchlistCounter) return;

    if (this.watchlist.length === 0) {
      watchlistGrid.innerHTML = `
                <div class="empty-state">
                    <p>No states in your watchlist. Add up to 5 states to track.</p>
                </div>
            `;
    } else {
      watchlistGrid.innerHTML = this.watchlist
        .map((stateName) => {
          const stateData = this.statesData.find((s) => s.state_name === stateName);
          if (!stateData) return "";

          return `
                    <div class="watchlist-card fade-in">
                        <div class="watchlist-card-header">
                            <h3>${stateData.state_name}</h3>
                            <button class="remove-btn" onclick="dashboard.removeFromWatchlist('${
                              stateData.state_name
                            }')" title="Remove from watchlist">×</button>
                        </div>
                        <div class="watchlist-stats">
                            <div class="stat-item">
                                <span class="stat-value active">${this.formatNumber(stateData.new_active)}</span>
                                <span class="stat-label">Active</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value new-cases">${this.formatNumber(
                                  stateData.new_positive - stateData.positive
                                )}</span>
                                <span class="stat-label">New Cases</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value recovered">${this.formatNumber(stateData.new_cured)}</span>
                                <span class="stat-label">Recovered</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value deaths">${this.formatNumber(stateData.new_death)}</span>
                                <span class="stat-label">Deaths</span>
                            </div>
                        </div>
                    </div>
                `;
        })
        .join("");
    }

    watchlistCounter.textContent = `${this.watchlist.length}/${this.maxWatchlistItems} states`;
  }

  renderTopPerformers() {
    this.renderTopActiveCases();
    this.renderTopNewCases();
  }

  renderTopActiveCases() {
    const container = document.getElementById("topActiveCases");
    if (!container) return;

    const sortedStates = [...this.statesData].sort((a, b) => b.active - a.active).slice(0, 3);

    container.innerHTML = sortedStates
      .map(
        (state) => `
            <div class="top-item fade-in">
                <div class="top-item-info">
                    <div class="top-item-state">${state.state_name}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="top-item-value">${this.formatNumber(state.new_active)}</div>
                </div>
            </div>
        `
      )
      .join("");
  }

  renderTopNewCases() {
    const container = document.getElementById("topNewCases");
    if (!container) return;

    const sortedStates = [...this.statesData].sort((a, b) => b.new_positive - a.new_positive).slice(0, 3);

    container.innerHTML = sortedStates
      .map(
        (state) => `
            <div class="top-item fade-in">
                <div class="top-item-info">
                    <div class="top-item-state">${state.state_name}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="top-item-value">${this.formatNumber(state.new_positive - state.positive)}</div>
                </div>
            </div>
        `
      )
      .join("");
  }

  renderDeathsList(sortBy = "newDeaths") {
    const container = document.getElementById("deathsList");
    if (!container) return;

    let sortedStates = [...this.statesData];

    // Filter states that have deaths in the last 24 hours
    const statesWithDeaths = sortedStates.filter((state) => state.actualdeath24hrs > 0);

    // Sort based on selected criteria
    switch (sortBy) {
      case "newDeaths":
        statesWithDeaths.sort((a, b) => b.actualdeath24hrs - a.actualdeath24hrs);
        break;
      case "deaths":
        statesWithDeaths.sort((a, b) => b.death - a.death);
        break;
      case "alphabetical":
        statesWithDeaths.sort((a, b) => a.state_name.localeCompare(b.state_name));
        break;
    }

    if (statesWithDeaths.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No deaths reported in the last 24 hours.</p></div>';
      return;
    }

    container.innerHTML = statesWithDeaths
      .map(
        (state) => `
            <div class="death-item fade-in">
                <div class="death-item-info">
                    <div class="death-item-state">${state.state_name}</div>
                    <div class="death-item-total">Total Deaths: ${this.formatNumberWithCommas(state.new_death)}</div>
                </div>
                <div class="death-item-new">+${this.formatNumber(state.actualdeath24hrs)}</div>
            </div>
        `
      )
      .join("");
  }

  refreshData() {
    // Simulate data refresh
    const refreshBtn = document.getElementById("refreshBtn");
    if (!refreshBtn) return;

    const originalText = refreshBtn.innerHTML;

    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;

    setTimeout(() => {
      // Update the last updated timestamp
      this.updateLastUpdated();

      // Refresh all sections
      this.renderCountrySummary();
      this.renderTopPerformers();
      this.renderDeathsList();
      this.renderWatchlist();

      refreshBtn.innerHTML = originalText;
      refreshBtn.disabled = false;
    }, 1000);
  }

  async updateLastUpdated() {
    const lastUpdatedElement = document.getElementById("lastUpdated");
    if (!lastUpdatedElement) return;

    let ldate = new Date();
    try {
      const response = await fetch("data/today.json", { method: "HEAD" });
      const lastModified = response.headers.get("Last-Modified");
      if (lastModified) {
        ldate = new Date(lastModified);
      }
    } catch (e) {}

    // Set the time to 10:00 AM
    ldate.setHours(10, 0, 0, 0);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    lastUpdatedElement.textContent = ldate.toLocaleDateString("en-US", options);
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  }

  formatNumberWithCommas(num) {
    return num.toLocaleString();
  }
}

// Initialize the dashboard when the page loads
let dashboard;

fetchAllRecords().then(() => {
  // Ensure the dashboard is initialized when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      dashboard = new CovidDashboard();
    });
  } else {
    dashboard = new CovidDashboard();
  }
});
