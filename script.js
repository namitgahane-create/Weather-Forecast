const apiKey = "9872f63f566fa52d214b691ee142d870"; 

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const result = document.getElementById("result");
const loading = document.getElementById("loading");
const historyContainer = document.getElementById("history");
const suggestionsBox = document.getElementById("suggestions");

let searchHistory = JSON.parse(localStorage.getItem("weatherHistory")) || [];

displayHistory();

searchBtn.addEventListener("click", getWeather);

cityInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

async function getWeather() {
    const city = cityInput.value.trim();
    if (!city) return alert("Enter city name");

    loading.style.display = "block";
    result.innerHTML = "";

    try {
        const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
        );

        const geoData = await geoRes.json();

        if (geoData.length === 0) throw new Error("City not found");

        const { lat, lon, name, country } = geoData[0];

        cityInput.value = `${name}, ${country}`;

        getWeatherByCoords(lat, lon);

        if (!searchHistory.includes(name)) {
            searchHistory.push(name);
            if (searchHistory.length > 5) searchHistory.shift();
            localStorage.setItem("weatherHistory", JSON.stringify(searchHistory));
            displayHistory();
        }

    } catch (error) {
        result.innerHTML = `<p style="color:red;">${error.message}</p>`;
        loading.style.display = "none";
    }
}

async function getWeatherByCoords(lat, lon) {

    try {
        const currentRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        if (!currentRes.ok) throw new Error("City not found");

        const currentData = await currentRes.json();

        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        const forecastData = await forecastRes.json();

        changeBackground(currentData.weather[0].main);
        displayWeather(currentData);
        displayForecast(forecastData);
        checkRainComing(forecastData);

    } catch (error) {
        result.innerHTML = `<p style="color:red;">City not found</p>`;
    }

    loading.style.display = "none";
}

function displayWeather(data) {
    const icon = data.weather[0].icon;

    result.innerHTML = `
        <h2>${data.name}, ${data.sys.country}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png">
        <p><strong>${data.main.temp}°C</strong></p>
        <p>${data.weather[0].description}</p>
        <h3>5 Day Forecast</h3>
        <div class="forecast" id="forecast"></div>
    `;
}

function displayForecast(data) {
    const forecastContainer = document.getElementById("forecast");
    forecastContainer.innerHTML = "";

    for (let i = 0; i < data.list.length; i += 8) {
        const day = data.list[i];
        const date = new Date(day.dt_txt).toLocaleDateString();
        const icon = day.weather[0].icon;
        const temp = day.main.temp;

        forecastContainer.innerHTML += `
            <div class="forecast-card">
                <p>${date}</p>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="forecast-icon">
                <p>${temp}°C</p>
            </div>
        `;
    }
}

function checkRainComing(data) {
    let rainTime = null;
    let rainProbability = 0;

    for (let i = 0; i < data.list.length; i++) {
        if (data.list[i].pop > 0) {
            rainTime = data.list[i].dt_txt;
            rainProbability = Math.round(data.list[i].pop * 100);
            break;
        }
    }

    const rainMessage = document.createElement("div");
    rainMessage.style.marginTop = "15px";
    rainMessage.style.fontWeight = "600";

    if (rainTime) {
        const dateObj = new Date(rainTime);
        const formattedTime = dateObj.toLocaleString("en-IN", {
            weekday: "short",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        });

        rainMessage.innerHTML = `
            🌧 Rain possible on ${formattedTime} <br>
            Chance of rain: ${rainProbability}%
        `;
        rainMessage.style.color = "#ff4d4d";
    } else {
        rainMessage.textContent = "☀️ No rain expected in next 5 days";
        rainMessage.style.color = "#00ffcc";
    }

    result.appendChild(rainMessage);
}

function changeBackground(weatherType) {
    const body = document.body;

    if (weatherType.includes("Cloud")) {
        body.style.background = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
    } else if (weatherType.includes("Clear")) {
        body.style.background = "linear-gradient(135deg, #fceabb, #f8b500)";
    } else if (weatherType.includes("Rain")) {
        body.style.background = "linear-gradient(135deg, #4e54c8, #8f94fb)";
    } else {
        body.style.background = "linear-gradient(135deg, #00c6ff, #0072ff)";
    }
}

cityInput.addEventListener("input", async () => {
    const query = cityInput.value.trim();

    if (query.length < 2) {
        suggestionsBox.innerHTML = "";
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
        );

        const data = await response.json();
        suggestionsBox.innerHTML = "";

        data.forEach(city => {
            const div = document.createElement("div");
            div.textContent = `${city.name}, ${city.country}`;

            div.addEventListener("click", () => {
                cityInput.value = `${city.name}, ${city.country}`;
                suggestionsBox.innerHTML = "";
                getWeatherByCoords(city.lat, city.lon);
            });

            suggestionsBox.appendChild(div);
        });

    } catch (error) {
        console.log(error);
    }
});

function displayHistory() {
    historyContainer.innerHTML = "";

    searchHistory.slice().reverse().forEach(city => {
        const div = document.createElement("div");
        div.textContent = city;
        div.classList.add("history-item");

        div.addEventListener("click", () => {
            cityInput.value = city;
            getWeather();
        });

        historyContainer.appendChild(div);
    });
}
