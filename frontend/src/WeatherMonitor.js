import React, { useState } from "react";
import {
  FaBell,
  FaCloudRain,
  FaDroplet,
  FaMagnifyingGlassPlus,
  FaMagnifyingGlassMinus,
  FaSatellite,
  FaTemperatureThreeQuarters,
  FaTowerBroadcast,
  FaWind
} from "react-icons/fa6";

const layers = [
  { id: "satellite", label: "Satellite", icon: <FaSatellite />, tone: "satellite" },
  { id: "radar", label: "Radar", icon: <FaTowerBroadcast />, tone: "radar" },
  { id: "precipitation", label: "Precipitation", icon: <FaCloudRain />, tone: "precipitation" },
  { id: "wind", label: "Wind", icon: <FaWind />, tone: "wind" },
  { id: "temperature", label: "Temperature", icon: <FaTemperatureThreeQuarters />, tone: "temperature" },
  { id: "humidity", label: "Humidity", icon: <FaDroplet />, tone: "humidity" }
];

const cityOptions = [
  { name: "New Delhi", lat: 28.6139, lon: 77.209, note: "North region monitoring" },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, note: "Coastal rainfall watch" },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, note: "Dry heat tracking" },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867, note: "Central zone observation" },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, note: "Eastern storm monitoring" },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, note: "South plateau updates" },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, note: "Bay of Bengal impact" }
];

const POPULAR_CITY_DEFAULT = cityOptions[0].name;

const latestAlerts = [
  { title: "Heavy rain watch", place: "Kolkata belt", severity: "high", detail: "Keep flood-prone farmer groups ready for advisory push." },
  { title: "Wind advisory", place: "Mumbai coast", severity: "medium", detail: "Monitor gust build-up before evening field movement." },
  { title: "Heat stress", place: "Jaipur zone", severity: "medium", detail: "High daytime temperature may affect midday farm work." },
  { title: "Humidity rise", place: "Chennai corridor", severity: "low", detail: "Moisture is increasing but no severe trigger yet." }
];

const layerEmbeds = {
  satellite: { overlay: "satellite", product: "satellite" },
  radar: { overlay: "radar", product: "radar" },
  precipitation: { overlay: "rain", product: "ecmwf" },
  wind: { overlay: "wind", product: "ecmwf" },
  temperature: { overlay: "temp", product: "ecmwf" },
  humidity: { overlay: "rh", product: "ecmwf" }
};

const buildMapUrl = (layerId, zoom, lat, lon) => {
  const layer = layerEmbeds[layerId];

  return `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=1200&height=760&zoom=${zoom}&level=surface&overlay=${layer.overlay}&product=${layer.product}&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
};

const searchCityCoordinates = async (query) => {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  );

  if (!response.ok) {
    throw new Error("Unable to search city right now.");
  }

  const data = await response.json();
  const result = data.results && data.results[0];

  if (!result) {
    throw new Error("City not found.");
  }

  return {
    name: result.name,
    lat: result.latitude,
    lon: result.longitude
  };
};

const WeatherMonitor = () => {
  const [activeLayer, setActiveLayer] = useState(layers[0]);
  const [zoom, setZoom] = useState(4);
  const [selectedPopularCity, setSelectedPopularCity] = useState(POPULAR_CITY_DEFAULT);
  const [customCityName, setCustomCityName] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 22.0, lon: 79.0 });
  const [searchState, setSearchState] = useState({ loading: false, error: "" });

  const jumpToCity = (city) => {
    setMapCenter({ lat: city.lat, lon: city.lon });
    setZoom(6);
    setSearchState({ loading: false, error: "" });
  };

  const handlePopularCityChange = (event) => {
    const nextValue = event.target.value;
    setSelectedPopularCity(nextValue);
    setSearchState({ loading: false, error: "" });

    if (nextValue === "other") {
      return;
    }

    const city = cityOptions.find((option) => option.name === nextValue);

    if (city) {
      jumpToCity(city);
    }
  };

  const handleCustomCitySubmit = async (event) => {
    event.preventDefault();

    if (selectedPopularCity !== "other") {
      const city = cityOptions.find((option) => option.name === selectedPopularCity);

      if (city) {
        jumpToCity(city);
      }

      return;
    }

    const query = customCityName.trim();

    if (!query) {
      setSearchState({ loading: false, error: "Type a city name first." });
      return;
    }

    try {
      setSearchState({ loading: true, error: "" });
      const result = await searchCityCoordinates(query);
      setMapCenter({ lat: result.lat, lon: result.lon });
      setZoom(6);
      setCustomCityName(result.name);
      setSearchState({ loading: false, error: "" });
    } catch (error) {
      setSearchState({ loading: false, error: error.message });
    }
  };

  return (
    <section className="dashboard-stack">
      <div className={`weather-map-shell tone-${activeLayer.tone}`}>
        <div className="weather-map-canvas">
          <iframe
            key={`${activeLayer.id}-${zoom}-${mapCenter.lat}-${mapCenter.lon}`}
            className="weather-map-frame"
            src={buildMapUrl(activeLayer.id, zoom, mapCenter.lat, mapCenter.lon)}
            title={`${activeLayer.label} weather map`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          <div className="weather-map-frame-tint" />

          <aside className="weather-map-menu">
            <p className="weather-map-menu-title">Weather Maps</p>
            <div className="weather-map-layer-list">
              {layers.map((layer) => (
                <button
                  key={layer.id}
                  className={`weather-map-layer ${activeLayer.id === layer.id ? "active" : ""}`}
                  onClick={() => setActiveLayer(layer)}
                  type="button"
                >
                  <span>{layer.icon}</span>
                  <span>{layer.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="weather-map-tools">
            <button
              className="weather-tool-button"
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((current) => Math.min(current + 1, 9))}
            >
              <FaMagnifyingGlassPlus />
            </button>
            <button
              className="weather-tool-button"
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((current) => Math.max(current - 1, 3))}
            >
              <FaMagnifyingGlassMinus />
            </button>
            <div className="weather-tool-level">Z{zoom}</div>
          </div>

        </div>
      </div>

      <div className="content-grid weather-monitor-bottom">
        <section className="panel weather-search-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">City Search</p>
              <h2>Quick Jump</h2>
            </div>
          </div>

          <form className="weather-search-form" onSubmit={handleCustomCitySubmit}>
            <label>
              Most popular city
              <select value={selectedPopularCity} onChange={handlePopularCityChange}>
                {cityOptions.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
                <option value="other">Other city</option>
              </select>
            </label>

            {selectedPopularCity === "other" ? (
              <label>
                Type any city name
                <input
                  type="text"
                  value={customCityName}
                  onChange={(event) => setCustomCityName(event.target.value)}
                  placeholder="Type any city name..."
                />
              </label>
            ) : null}

            <div className="button-row weather-search-actions">
              <button className="primary-button" type="submit" disabled={searchState.loading}>
                {searchState.loading ? "Searching..." : "Go to City"}
              </button>
            </div>
            {searchState.error ? <p className="status error">{searchState.error}</p> : null}
          </form>
        </section>

        <section className="panel weather-alerts-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest Alerts</p>
              <h2>Weather Alerts Feed</h2>
            </div>
          </div>

          <div className="weather-alert-feed">
            {latestAlerts.map((alert) => (
              <article key={`${alert.title}-${alert.place}`} className="weather-alert-card">
                <div className="weather-alert-top">
                  <div className="weather-alert-title">
                    <FaBell />
                    <strong>{alert.title}</strong>
                  </div>
                  <span className={`risk-badge ${alert.severity}`}>{alert.severity}</span>
                </div>
                <p className="weather-alert-place">{alert.place}</p>
                <p className="muted">{alert.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default WeatherMonitor;
