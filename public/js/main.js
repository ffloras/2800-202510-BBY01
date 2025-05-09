setupMapbox();
setLocationSavedStatus();
setLocationName();


//sets up mapbox search bar and map
async function setupMapbox() {
  const script = document.getElementById('search-js');
  // wait for the Mapbox Search JS script to load before using it
  script.onload = async function () {

    //mapbox access token
    let token = await getMapboxToken();

    let searchBar = new MapboxGeocoder();
    searchBar.accessToken = token
    // set the options property
    // searchBar.options = {
    //   language: 'en',
    //   country: 'CA'
    // }

    document.getElementById('search-bar').appendChild(searchBar);

    mapboxgl.accessToken = token;

    let searchLocation = await getCurrentSearchLocation();
    let searchCoordinate = searchLocation ? searchLocation.coordinate : null;

    let map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: getCoordinateFromURL() || searchCoordinate || [-122.95263, 49.26636], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });

    // set the mapboxgl library to use for markers and enable the marker functionality
    searchBar.mapboxgl = mapboxgl
    searchBar.marker = true

    // bind the search box instance to the map instance
    searchBar.bindMap(map)

    newSearch(searchBar);

    setSaveLocationButton();
  }
}

//return coordinate array from this page's URL consisting of longitude and latitude
function getCoordinateFromURL() {
  let url = new URL(window.location.href);
  let params = url.searchParams.get("coor");
  let coor = null;
  if (params) {
    coor = params.split(",");
  }
  return coor;
}

//updates the current searched location in the database, updates location save status and name on main page
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

    setLocationSavedStatus();
    setLocationName();

  });
}

//adds event listener to save location button
function setSaveLocationButton() {
  document.getElementById("save").addEventListener("click", (e) => {
    saveLocation();
    document.getElementById("saveLocation").innerHTML = "Location saved";
    document.getElementById("saveIcon").src = "/img/saveIconChecked.png";
  })
}

//save current searched location into savedLocation in database
async function saveLocation() {
  if (!(await isLocationSaved())) {
    ajaxGET('/saveLocation', (response) => {
      if (!response.ok) 
        console.log(response);
      window.location.replace("/login");
    })
  }
}

//returns the current search location from the database
function getCurrentSearchLocation() {
  return new Promise((resolve, reject) => {
    ajaxGET('/getCurrentSearchLocation', (response) => {
      try {
        //console.log("hi" + JSON.parse(response).address)
        resolve(JSON.parse(response));

      } catch (error) {
        resolve(null);
      }
    });
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