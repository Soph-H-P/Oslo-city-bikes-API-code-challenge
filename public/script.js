/*
Your task is to create a small application that utilizes this api to show the stations and the
amount of available bikes and free spots a station currently has. You’re free to choose
which language and libraries you use. How you show the stations and status is also up to
you.

*/

//RENDERING MAP TILES - default location center of Oslo, if user doesn't consent to give location
const stationMap = L.map('stations_map').setView([59.9139, 10.7522], 15);
let tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
});

tiles.addTo(stationMap);


//LOCATE USER
function onLocationFound(location) {
  const radius = location.accuracy / 2;
  L.circle(location.latlng, radius).addTo(stationMap)
  .bindPopup(`You are here`).openPopup();
}
stationMap.on('locationfound', onLocationFound);
stationMap.locate({setView: true, watch: false, maxZoom: 17});





//ACCESSING STATION LOCATIONS- longitude and latitude, name and address
const stationInfoUrl = 'http://gbfs.urbansharing.com/oslobysykkel.no/station_information.json'

async function getStationInfo() {
  const res = await fetch(stationInfoUrl);
  const data = await res.json();
  const dataArray = JSON.parse(JSON.stringify(data.data.stations));
  const location = {};
  dataArray.forEach(function (station) {
    location[`id${station.station_id}`] = {lat : station.lat, lon : station.lon, name : station.name, address : station.address}
  });
  return location;
};

const stationInfo = getStationInfo();



//ACCESSING STATION STATUS - available bikes and spaces
const stationStatusUrl = 'http://gbfs.urbansharing.com/oslobysykkel.no/station_status.json';

async function getBikeInfo() {
  const res = await fetch(stationStatusUrl);
  const data = await res.json();
  const dataArray = JSON.parse(JSON.stringify(data.data.stations));
  const availability = {};
  dataArray.forEach(function (station) {
    availability[`id${station.station_id}`] = {bikes : station.num_bikes_available, docks : station.num_docks_available}
  });
  return availability;
}

const stationStatus = getBikeInfo();





//PLOTS THE STATIONS ON MAP
//Icon class for station markers on the map

let searchFilter = 'bikes';
function plotMap() {
 getStationInfo().then(async function(stations) {
  const bikes = await stationStatus;
  const MarkerIcon = L.Icon.extend({
                                    options: {
                                    iconSize: [30, 30],
                                    iconAnchor: [5, 5],
                                    popupAnchor: [10, 0],
                                  }
                                });
//LOOPS THROUGH STATIONSTATUS OBJECT- assigns correct marker (bikes/docks, available/unavailable)                                  
    for (let [stationId, location] of Object.entries(stations)) {
    const freeBikes = new MarkerIcon({iconUrl: '../free_bikes.png'});
    const noFreeBikes = new MarkerIcon({iconUrl: '../no_free_bikes.png'});
    const freeDocks = new MarkerIcon({iconUrl: '../free_parking.png'});
    const noFreeDocks = new MarkerIcon({iconUrl: '../no_free_parking.png'});
    let marker;
    if(searchFilter === "bikes") {
      if (bikes[stationId].bikes === 0) {
        marker = L.marker([0, 0], {icon: noFreeBikes}).addTo(stationMap);
      } else {
        marker = L.marker([0, 0], {icon: freeBikes}).addTo(stationMap);
      };
    } else {
        if (bikes[stationId].docks === 0) {
          marker = L.marker([0, 0], {icon: noFreeDocks}).addTo(stationMap);
      } else {
          marker = L.marker([0, 0], {icon: freeDocks}).addTo(stationMap);
      };
    };
    marker.bindPopup(`<p class="popup"> 
    <span id="popup_title">${location.name} <br></span> 
    <span id="address">Address: ${location.address} <br> </span> 
    <b><i class="material-icons w3-medium">pedal_bike</i>
    ${bikes[stationId].bikes}</b>  bikes <br> 
    <b><i class="material-icons w3-medium">local_parking</i>${bikes[stationId].docks}</b> free spaces  </p>`);
    marker.setLatLng([location.lat, location.lon]);
    };
    return stations;
});
};

plotMap();


//ALLOWS USER TO FILTER BIKES OR DOCKS
const searchButton = document.querySelector('.search_button');
searchButton.addEventListener('click', () => {
const pageTitle = document.querySelector('.title');
  if(searchFilter != 'bikes') {
    searchButton.classList.add('bike');
    searchButton.innerHTML = '<button type="button" class="button" id="park"><i class="material-icons w3-jumbo">local_parking</i></button>';
    pageTitle.innerHTML = "Find a bike";
    searchFilter = 'bikes';
    plotMap();
  } else {
    searchButton.classList.remove('bike');
    searchButton.innerHTML = '<button type="button" class="button" id="bike"><i class="material-icons w3-jumbo">pedal_bike</i></button>';
    pageTitle.innerHTML = "Find somewhere to park";
    searchFilter = 'docks';
    plotMap();
  }
});


//ALLOWS USER TO DISPLAY MAP IN DARKER COLORSCHEME
const darkModeButton = document.querySelector('.dark_mode');
let darkMode = false;
darkModeButton.addEventListener('click', () => {
  
  let myFilter = [
    'blur:0px',
    'brightness:40%',
    'contrast:130%',
    'grayscale:80%',
    'hue:0deg',
    'opacity:100%',
    'invert:0%',
    'saturate:100%',
    'sepia:10%',
  ];

  //toggle darkmode
  if(!darkMode) {
    darkModeButton.classList.add('on');
    darkMode = true;
    darkModeButton.innerHTML = '<i class="material-icons w3-large">wb_sunny</i>';
    let darkTileLayer = L.tileLayer.colorFilter('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {
          attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
          filter: myFilter,
      }).addTo(stationMap);
  } else {
    darkModeButton.classList.remove('on');
    darkMode = false;
    darkModeButton.innerHTML = '<i class="material-icons w3-large">nights_stay</i>';
    let lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(stationMap);
  };
});



//TOGGLE HELP MENU
let helpMe = false;
const helpButton = document.querySelector('.help'); 

helpButton.addEventListener('click', () => {
const helptext = document.querySelector('.help_container');
if(!helpMe) {
  helptext.classList.add('visible');
  helptext.classList.remove('hidden');
  helpMe = true;
  
  
} else {
  helptext.classList.remove('visible');
  helptext.classList.add('hidden');
  helpMe = false;
  
}
});