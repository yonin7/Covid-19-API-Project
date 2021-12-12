const myStorage = window.localStorage;
const continentsEl = document.querySelector('.continents');
const countriesEl = document.querySelector('.countries');
const countriesListEl = document.querySelector('.countriesList');
const graphEl = document.querySelector('.graph');
const parametersEl = document.querySelector('.parameters');
const loaderEl = document.querySelector('.loader');

let chart = null;
let covidData = null;
let adCountries = [];
let ekCountries = [];
let lpCountries = [];
let qvCountries = [];
let wzCountries = [];
function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key]['name'] === value);
}
async function getCountriesData(continent) {
  let countries = null;
  let url = null;
  if (!isStored(continent, false)) {
    if (continent != 'World')
      url = `https://intense-mesa-62220.herokuapp.com/https://restcountries.herokuapp.com/api/v1/region/${continent}`;
    else
      url = `https://intense-mesa-62220.herokuapp.com/https://restcountries.herokuapp.com/api/v1/`;
    countries = await fetch(url);
    countries = await countries.json();
    saveToMemory(continent, countries);
  }

  countries = getFromMemory(continent);
  return countries;
}

async function getCovidData(continent, countries) {
  if (!isStored(continent, true)) {
    loaderEl.style.visibility = 'visible';
    let countriesFetch = [];
    countries.forEach((element) => {
      countriesFetch.push(
        fetch(
          `https://intense-mesa-62220.herokuapp.com/http://corona-api.com/countries/${element}`
        )
      );
    });
    let covidData = await Promise.all(countriesFetch);
    covidData = covidData.map((data) => {
      return data.json();
    });
    covidData = await Promise.all(covidData);
    updateMemory(continent, covidData);
    loaderEl.style.visibility = 'hidden';
  }

  return getFromMemory(continent);
}

function isStored(continent, withCovid) {
  let continentData = myStorage.getItem(continent);
  if (continentData == null) return false;
  continentData = JSON.parse(continentData);
  let isCovid = 'latestDataConfirmed' in Object.values(continentData)[0];
  if (withCovid && !isCovid) return false;
  return true;
}

function getFromMemory(continent) {
  return JSON.parse(myStorage.getItem(continent));
}

function saveToMemory(continent, countries) {
  countriesObject = {};
  countries.forEach((element) => {
    countriesObject[element.cca2] = { name: element.name.common };
  });

  myStorage.setItem(continent, JSON.stringify(countriesObject));
}

function updateMemory(continent, countries) {
  console.log(countries);
  let memoryData = myStorage.getItem(continent);
  memoryData = JSON.parse(memoryData);
  countries.forEach((country) => {
    // if (!Object.keys(memoryData).contains(country.data.code) ) {continue}
    console.log(country);
    if ('data' in country && country.data.code in memoryData) {
      memoryData[country.data.code]['todayDeaths'] = country.data.today.deaths;
      memoryData[country.data.code]['todayConfirmed'] =
        country.data.today.confirmed;
      memoryData[country.data.code]['latestDataDeaths'] =
        country.data.latest_data.deaths;
      memoryData[country.data.code]['latestDataConfirmed'] =
        country.data.latest_data.confirmed;
      memoryData[country.data.code]['latestDataRecovered'] =
        country.data.latest_data.recovered;
      memoryData[country.data.code]['latestDataCritical'] =
        country.data.latest_data.critical;
      memoryData[country.data.code]['latestDataDeathRate'] =
        country.data.latest_data.calculated.death_rate;
      memoryData[country.data.code]['latestDataRecoveredRate'] =
        country.data.latest_data.calculated.recovery_rate;
      memoryData[country.data.code]['latestDataCasesPerMillionPopulation'] =
        country.data.latest_data.calculated.cases_per_million_population;
    }
  });
  myStorage.setItem(continent, JSON.stringify(memoryData));
}

async function setContinentsData(event) {
  event.preventDefault();
  let continent = event.target.innerText;
  let countries = await getCountriesData(continent);
  covidData = await getCovidData(continent, Object.keys(countries));
  updateParametersButton();
  setParameters('Confirmed');
}

function updateParametersButton() {
  document.querySelector('.parameters').style.visibility = 'visible';
  document.querySelector('.countries').style.visibility = 'visible';
}

function getCurrentLettersList(firstLetter) {
  if (firstLetter == 'a') return adCountries;
  if (firstLetter == 'e') return ekCountries;
  if (firstLetter == 'l') return lpCountries;
  if (firstLetter == 'q') return qvCountries;
  if (firstLetter == 'w') return wzCountries;
}

function createLetterList(countriesList) {
  countriesListEl.style.visibility = 'visible';
  countriesListEl.innerHTML = '';
  let orderList = document.createElement('ul');
  countriesList.forEach((countryName) => {
    let listItem = document.createElement('li');
    let name = document.createElement('a');
    name.innerText = countryName;
    name.href = '#';
    name.class = 'links';
    name.id = getKeyByValue(covidData, countryName);
    listItem.appendChild(name);
    orderList.appendChild(listItem);
  });
  countriesListEl.appendChild(orderList);
}

function setCountriesList(event) {
  event.preventDefault();
  let letters = event.target;
  let firstLetter = letters.className.substring(0, 1);
  let lastLetter = letters.className.substring(2);
  adCountries = [];
  ekCountries = [];
  lpCountries = [];
  qvCountries = [];
  wzCountries = [];
  let listName = getCurrentLettersList(firstLetter);
  Object.values(covidData).forEach((country) => {
    let firstChar = country.name.substring(0, 1).toLowerCase();
    if (firstChar >= firstLetter && firstChar <= lastLetter) {
      listName.push(country.name);
    }
  });
  console.log(listName);
  listName.sort((a, b) => a.localeCompare(b));
  createLetterList(listName);
}

function setParameters(parameter) {
  let data = [];
  let legends = [];
  Object.values(covidData).forEach((country) => {
    legends.push(country.name);
    if (parameter == 'Confirmed') data.push(country.latestDataConfirmed);
    else if (parameter == 'Deaths') data.push(country.latestDataDeaths);
    else if (parameter == 'Recovered') data.push(country.latestDataRecovered);
    else if (parameter == 'Criticals') data.push(country.latestDataCritical);
    else if (parameter == 'DeathRate') data.push(country.latestDataDeathRate);
    else if (parameter == 'Recovered Rate')
      data.push(country.latestDataRecoveredRate);
    else data.push(country.latestDataCasesPerMillionPopulation);
  });
  chartData = {
    labels: legends,
    datasets: [
      {
        label: parameter,
        data: data,
        borderWidth: 1,
      },
    ],
  };
  setChart(chartData, 'line');
}

function setCountryParameters(countryCode) {
  let countryData = covidData[countryCode];
  let data = {};
  let legends = [];
  let todayData = [];
  let generalData = [];
  let todayLegends = [];
  let generalLegends = [];
  let title = '';
  for (let [key, value] of Object.entries(countryData)) {
    if (key == 'name') title = value;
    else {
      if (key.includes('today')) {
        todayData.push(value * -1);
        // todayLegends.push(key.replace(/([A-Z])/g, '$1').trim());
      } else {
        generalData.push(value);
        // generalLegends.push();
      }
      legends.push(key.replace(/([A-Z])/g, '$1').trim());
    }
  }
  chartData = {
    label: title,
    datasets: [
      {
        labels: todayLegends,
        data: todayData,
        borderWidth: 1,
      },
      {
        labels: generalLegends,
        data: generalData,
        borderWidth: 1,
      },
    ],
    labels: legends,
  };
  setChart(chartData, 'radar');
}
function setChart(chartData, chartType) {
  const myChartEl = document.querySelector('#myChart');
  if (chart != null) {
    chart.destroy();
  }
  chart = new Chart(myChartEl, {
    type: chartType,
    data: chartData,
    options: {
      backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
      borderColor: 'rgb(255, 99, 132)',
      pointBackgroundColor: 'rgb(255, 99, 132)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(255, 99, 132)',
      maintainAspectRatio: false,
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        xAxes: [
          {
            ticks: {},
          },
        ],
      },
    },
  });
}

continentsEl.addEventListener('click', setContinentsData);
countriesEl.addEventListener('click', setCountriesList);
parametersEl.addEventListener('click', function (event) {
  event.preventDefault();
  let btn = event.target;
  setParameters(btn.innerText);
});
countriesListEl.addEventListener('click', function (event) {
  event.preventDefault();
  let btn = event.target;
  console.log(btn.id);
  if (btn.id == '') return;
  setCountryParameters(btn.id);
});
