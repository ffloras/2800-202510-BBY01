setupMapbox();
setLocationSavedStatus();
setLocationName();
setSaveLocationButton();
setupAI();

//sets up mapbox search bar, map, maplayers and environmental risks
async function setupMapbox() {
  const script = document.getElementById('search-js');
  // wait for the Mapbox Search JS script to load before using it
  script.onload = async function () {

    //mapbox access token
    let token = await getMapboxToken();

    let searchBar = new MapboxGeocoder();
    searchBar.accessToken = token;

    document.getElementById('search-bar').appendChild(searchBar);

    mapboxgl.accessToken = token;

    //gets most current searched location from either database or session storage
    let searchLocation = await getCurrentSearchLocation();
    let searchCoordinate = searchLocation ? searchLocation.coordinate : null;

    //sets up mapbox map
    let map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: searchCoordinate || getCoordinateFromSessionStorage() || [-122.95263, 49.26636], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });

    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }));

    // set the mapboxgl library to use for markers and enable the marker functionality
    searchBar.mapboxgl = mapboxgl;
    searchBar.marker = true;

    // bind the search box instance to the map instance
    searchBar.bindMap(map);

    //sets up for new location searches
    newSearch(searchBar);

    //gets environmental risks of a location using either most current searched location saved in database or session storage
    getRisks(searchCoordinate || getCoordinateFromSessionStorage());

    map.on('load', () => {

      map.addSource('wms-source-2', {
        type: 'raster',
        tiles: [
          'https://openmaps.gov.bc.ca/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP/ows?service=WMS&request=GetMap&version=1.3.0&layers=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}'
        ],
        tileSize: 256
      });

      map.addLayer({
        id: 'wms-layer-2',
        type: 'raster',
        source: 'wms-source-2',
        layout: { visibility: "none" },
        paint: {} 
      });

      // Satellite toggle
      let isSatellite = false;
      document.getElementById('toggleSatellite').addEventListener('click', () => {
        $("#toggleWildFires").removeClass("active");
        $("#togglePrecipitation").removeClass("active");
        $("#toggleTemperature").removeClass("active");
        $(this).toggleClass("active");
        if (!isSatellite) {
          map.setStyle('mapbox://styles/mapbox/satellite-v9');
          isSatellite = true;
        } else {
          map.setStyle('mapbox://styles/mapbox/outdoors-v12');

          isSatellite = false;
        }
      });

      // Wildfires toggle
      document.getElementById('toggleWildFires').addEventListener('click', () => {
        $(this).toggleClass("none");
        const visibility = map.getLayoutProperty('wildfires-layer', 'visibility');
        map.setLayoutProperty('wildfires-layer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
      });

      // Precipitation toggle
      document.getElementById('togglePrecipitation').addEventListener('click', () => {
        $(this).toggleClass("active");
        const visibility = map.getLayoutProperty('wms-layer-2', 'visibility');
        map.setLayoutProperty('wms-layer-2', 'visibility', visibility === 'visible' ? 'none' : 'visible');
      });

      // Temperature toggle
      document.getElementById('toggleTemperature').addEventListener('click', () => {
        const visibility = map.getLayoutProperty('temperature-layer', 'visibility');
        map.setLayoutProperty('temperature-layer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
      });

      addWildfireLayer(map);
      addTemperatureLayer(map);
      map.on('style.load', () => {
        // Re-add precipitation source and layer
        map.addSource('wms-source-2', {
          type: 'raster',
          tiles: [
            'https://openmaps.gov.bc.ca/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP/ows?service=WMS&request=GetMap&version=1.3.0&layers=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}'
          ],
          tileSize: 256
        });

        map.addLayer({
          id: 'wms-layer-2',
          type: 'raster',
          source: 'wms-source-2',
          paint: {},
          layout: { visibility: 'none' }
        });

        // Re-add wildfire layer
        addWildfireLayer(map);
        addTemperatureLayer(map);
      });
    });
  };
}

//return coordinate array from browser's session storage consisting of longitude and latitude
function getCoordinateFromSessionStorage() {
  // let url = new URL(window.location.href);
  // let params = url.searchParams.get("coor");
  // let coor = null;
  let coor = sessionStorage.getItem("coor");
  if (coor) {
    coorArray = coor.split(",");
    return coorArray;
  } else {
    return null;
  }
}

//updates the current searched location in the database, updates location save status and name on main page
//when new location is searched
function newSearch(searchBar) {
  // add an event listener to retrieve coordinates of searched location
  searchBar.addEventListener('retrieve', async (e) => {
    const feature = e.detail; // geojson object representing the selected item

    //if user is logged in, save search location in db
    const response = await fetch('/recordCurrentLocation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentLocation: feature }),
    });

    //saves location to session storage
    let coordinate = feature.geometry.coordinates;
    sessionStorage.setItem("coor", coordinate);

    document.getElementById("ai-message").innerHTML = "Explore what this location's climate would be like in the next few decades.";
    
    //sets saved status and name of new location
    setLocationSavedStatus();
    setLocationName();

    //gets risks of new location
    getRisks(coordinate);

  });
}

//adds event listener to save location button
function setSaveLocationButton() {
  let popup = document.getElementById("popup-overlay");
  popup.style.display = "none";
  popup.innerHTML = "";

  document.getElementById("save").addEventListener("click", async (e) => {
    ajaxGET("/popup", (data) => {
      popup.style.display = "flex";
      popup.innerHTML = data;

      //set 'save location' popup buttons
      if (document.getElementById("alert")) {
        document.getElementById("alert-cancel").addEventListener("click", (e) => {
          popup.style.display = "none";
          popup.innerHTML = "";
        });
        document.getElementById("alert-save").addEventListener("click", (e) => {
          let alertChecked = document.getElementById("alert-checkbox").checked;
          saveLocation(alertChecked);
          document.getElementById("saveLocation").innerHTML = "Location saved";
          document.getElementById("saveIcon").src = "/img/saveIconChecked.png";
          popup.style.display = "none";
          popup.innerHTML = "";
        });
      }

      //set "already-saved" popup for locations already saved in database
      else if (document.getElementById("already-saved")) {
        document.getElementById("saved-back").addEventListener("click", (e) => {
          popup.style.display = "none";
          popup.innerHTML = "";
        });
      }

      //set login popup for users not logged in
      else {
        document.getElementById("login").addEventListener("click", (e) => {
          popup.style.display = "none";
          popup.innerHTML = "";
        });
      }
    });

  });
}

//save current searched location into savedLocation in database
async function saveLocation(alert) {
  if (!(await isLocationSaved())) {
    fetch("/saveLocation", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ alert: alert }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to save location");
        }
      })
      .catch((error) => console.error("Failed to save location: ", error));
  }
}

//returns the current search location from the database
function getCurrentSearchLocation() {
  return new Promise((resolve, reject) => {
    fetch('/getCurrentSearchLocation')
      .then((response) => { return response.json(); })
      .then((response) => { resolve(response); })
      .catch(() => resolve(null));
  });

}

//checks if current location has already been saved
function isLocationSaved() {
  return new Promise((resolve, reject) => {
    ajaxGET("/checkLocationSaved", (response) => {
      try {
        resolve(JSON.parse(response));
      } catch (error) {
        reject(error);
      }
    });
  });
}

//sets save location button depending on if current search location is saved in database
async function setLocationSavedStatus() {
  let isSaved = await isLocationSaved();
  if (isSaved) {
    document.getElementById("saveLocation").innerHTML = "Location saved";
    document.getElementById("saveIcon").src = "/img/saveIconChecked.png";
  } else {
    document.getElementById("saveLocation").innerHTML = "Save Location";
    document.getElementById("saveIcon").src = "/img/saveIconUnchecked.png";
  }
}

//sets the current search location name
async function setLocationName() {
  let name = await getCurrentSearchLocation();
  if (name) {
    document.getElementById("locationName").innerHTML = name.address;
  }
}

//sets up climate prediction button that uses AI responses
async function setupAI() {
  document.getElementById("ai-button").addEventListener("click", async (e) => {
    let searchLocation = await getCurrentSearchLocation();
    let coorArray = searchLocation ? searchLocation.coordinate : getCoordinateFromSessionStorage();

    if (coorArray) {
      let coor = {
        long: coorArray[0],
        lat: coorArray[1]
      };

      //requests response from AI using coordinates of current location
      fetch("/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(coor)
      })
        .then(async (response) => {
          let html = await response.text();
          document.getElementById("ai-message").innerHTML = html;
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      let html = "Unable to get location information. Please search the location again.";
      document.getElementById("ai-message").innerHTML = html;
    }
  });
}

//gets the climate alerts
//param: coor = location coordinates array in the format [long, lat]
function getRisks(coor) {
  if (coor) {
    fetch("/getRisks", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(coor),
    })
      .then((response) => { return response.text(); })
      .then((response) => {
        document.getElementById("riskContent").innerHTML = response;
      })
      .catch((err) => {
        console.error("Error obtaining risk information");
      });
  } else {
    let message = "<h6 class='alertHeading'>No Location Selected.</h6>";
    document.getElementById("riskContent").innerHTML = message;
  }
}

//Function to add wildfire layer to mapbox
function addWildfireLayer(map) {
  if (!map.getSource('wildfires')) {
    map.addSource('wildfires', {
      type: 'geojson',
      data: {
        "type": "FeatureCollection",
        "features": [
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-122.85, 49.95] },
            "properties": { "name": "Garibaldi Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-122.98, 50.12] },
            "properties": { "name": "Whistler Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-123.25, 49.85] },
            "properties": { "name": "Tantalus Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-122.75, 50.45] },
            "properties": { "name": "Coast Mountains Fire" }
          },
         
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-122.45, 49.45] },
            "properties": { "name": "Golden Ears Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-120.85, 49.07] },
            "properties": { "name": "Manning Park Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-116.25, 50.5] },
            "properties": { "name": "Purcell Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-118.2, 51.0] },
            "properties": { "name": "Selkirk Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-116.0, 50.9] },
            "properties": { "name": "Kootenay Fire" }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-119.15, 53.1] },
            "properties": { "name": "Mount Robson Fire" }
          }
        ]
      }
    });
  }
  if (!map.getLayer('wildfires-layer')) {
    map.addLayer({
      id: 'wildfires-layer',
      type: 'circle',
      source: 'wildfires',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff6600',
        'circle-opacity': 0.7
      },
      layout: { visibility: 'none' } // OFF by default
    });
  }
}

//Adds temperature hotspots to mapbox
function addTemperatureLayer(map) {
  if (!map.getSource('temperature')) {
    map.addSource('temperature', {
      type: 'geojson',
      data: {
        "type": "FeatureCollection",
        "features": [
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-123.1, 49.3] },
            "properties": { "temperature": 18 }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-120.3, 50.7] },
            "properties": { "temperature": 22 }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-115.8, 49.5] },
            "properties": { "temperature": 25 }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-122.8, 53.9] },
            "properties": { "temperature": 15 }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-128.6, 54.5] },
            "properties": { "temperature": 12 }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-119.5, 49.9] },
            "properties": { "temperature": 28 }
          },
          
          {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-122.1, 52.1] },
            "properties": { "temperature": 17 }
          }
        ]
      }
    });
  }
  if (!map.getLayer('temperature-layer')) {
    map.addLayer({
      id: 'temperature-layer',
      type: 'circle',
      source: 'temperature',
      paint: {
        'circle-radius': 18,
        'circle-blur': 0.7,
        'circle-opacity': 0.6,
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          10, '#2c7bb6',   // cold (blue)
          15, '#abd9e9',
          20, '#ffffbf',   // mild (yellow)
          25, '#fdae61',
          30, '#d7191c'    // hot (red)
        ]
      },
      layout: { visibility: 'none' } // OFF by default
    });
  }
}
