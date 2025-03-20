const apiKey = "5e8f67313875d47a4cd091efd0890c80";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?q=";
const forecastApiUrl = "https://api.openweathermap.org/data/2.5/forecast?q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.getElementById("search-btn");
const voiceBtn = document.getElementById("voice-btn");
const geoBtn = document.getElementById("geo-btn");
const weatherIcon = document.querySelector(".weather-icon");
const forecastContainer = document.querySelector(".forecast-container");
const forecastSection = document.getElementById("forecast");
const loader = document.getElementById("loader");
const darkToggle = document.getElementById("dark-toggle");
const errorDiv = document.getElementById("error");
const weatherDiv = document.getElementById("weather");

// Remove "hidden" class on load to trigger fade-in
window.addEventListener("load", () => {
  document.querySelector(".card").classList.remove("hidden");
});

async function checkWeather(city) {
  try {
    showLoader();
    const response = await fetch(`${weatherApiUrl}${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) {
      hideLoader();
      showError();
      return;
    }
    const data = await response.json();

    document.querySelector(".city").innerHTML = data.name;
    document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
    document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
    document.querySelector(".wind").innerHTML = data.wind.speed + "km/h";

    // Set weather icon based on condition
    const condition = data.weather[0].main;
    weatherIcon.src = getWeatherIcon(condition);

    // Apply animations based on weather condition
    applyWeatherAnimation(condition.toLowerCase());

    weatherDiv.style.display = "block";
    errorDiv.style.display = "none";

    fetchForecast(city);
    hideLoader();
  } catch (error) {
    console.error("Error fetching weather data:", error);
    hideLoader();
    showError();
  }
}

async function fetchForecast(city) {
  try {
    const response = await fetch(`${forecastApiUrl}${city}&appid=${apiKey}&units=metric`);
    if (!response.ok) {
      forecastSection.style.display = "none";
      return;
    }
    const forecastData = await response.json();
    forecastContainer.innerHTML = "";

    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
      const forecastDate = item.dt_txt.split(" ")[0]; // Extract YYYY-MM-DD
      const time = item.dt_txt.split(" ")[1]; // Extract time HH:MM:SS

      // Select only one forecast per day, preferably at 12:00 PM
      if (!dailyForecasts[forecastDate] && time === "12:00:00") {
        dailyForecasts[forecastDate] = item;
      }
    });

    const filteredForecasts = Object.values(dailyForecasts).slice(0, 5);

    filteredForecasts.forEach(item => {
      const forecastDate = new Date(item.dt * 1000);
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      const dayString = forecastDate.toLocaleDateString(undefined, options);
      const temp = Math.round(item.main.temp) + "°C";
      const icon = getWeatherIcon(item.weather[0].main);

      const forecastItem = document.createElement("div");
      forecastItem.className = "forecast-item";
      forecastItem.innerHTML = `
        <h4>${dayString}</h4>
        <img src="${icon}" alt="${item.weather[0].main}" width="50">
        <p>${temp}</p>
      `;
      forecastContainer.appendChild(forecastItem);
    });

    forecastSection.style.display = "block";
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    forecastSection.style.display = "none";
  }
}

function getWeatherIcon(condition) {
  const icons = {
    "Clouds": "clouds.png",
    "Clear": "clear.png",
    "Rain": "rain.png",
    "Drizzle": "drizzle.png",
    "Mist": "mist.png",
    "Snow": "snow.png"
  };
  return icons[condition] || "clear.png";
}

// Apply animations based on weather condition
function applyWeatherAnimation(weatherCondition) {
    let body = document.body;

    // Remove previous animations
    body.classList.remove("rainy", "snowy", "clear", "cloudy");

    // changes based on condition
    if (weatherCondition.includes("rain")) {
        body.classList.add("rainy");
    } else if (weatherCondition.includes("snow")) {
        body.classList.add("snowy");
    } else if (weatherCondition.includes("clear")) {
        body.classList.add("clear");
    } else if (weatherCondition.includes("cloud")) {
        body.classList.add("cloudy");
    }
}

function showLoader() {
  loader.style.display = "block";
}

function hideLoader() {
  loader.style.display = "none";
}

function showError() {
  errorDiv.style.display = "block";
  weatherDiv.style.display = "none";
  forecastSection.style.display = "none";
}

// Event listeners for search button and input field
searchBtn.addEventListener("click", () => {
  const city = searchBox.value.trim();
  if (city) {
    checkWeather(city);
  }
});

searchBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

// Voice recognition using Web Speech API
voiceBtn.addEventListener("click", () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Your browser does not support speech recognition. Try Chrome or Edge.");
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    searchBox.value = transcript;
    checkWeather(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    alert("Sorry, there was an error with voice recognition. Please try again.");
  };
});

// Geolocation using navigator.geolocation API
geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    showLoader();
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
        .then(response => response.json())
        .then(data => {
          searchBox.value = data.name;
          checkWeather(data.name);
          hideLoader();
        })
        .catch(error => {
          console.error("Error fetching geolocation weather:", error);
          hideLoader();
          showError();
        });
    }, (error) => {
      console.error("Geolocation error:", error);
      hideLoader();
      alert("Unable to retrieve your location.");
    });
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});

// Dark Mode Toggle
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  document.querySelector(".card").classList.toggle("light-mode");
  document.querySelector(".navbar").classList.toggle("light-mode");
  document.querySelectorAll(".nav-links li a").forEach(link => {
    link.classList.toggle("light-mode");
  });
});
