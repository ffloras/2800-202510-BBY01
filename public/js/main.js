setupMapbox();
setLocationSavedStatus();
setLocationName();
setSaveLocationButton();
setupAI()

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
      center: searchCoordinate || getCoordinateFromSessionStorage() || [-122.95263, 49.26636], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });

    // set the mapboxgl library to use for markers and enable the marker functionality
    searchBar.mapboxgl = mapboxgl
    searchBar.marker = true

    // bind the search box instance to the map instance
    searchBar.bindMap(map)

    newSearch(searchBar);
    getRisks(searchCoordinate || getCoordinateFromSessionStorage());

  }
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

    let coordinate = feature.geometry.coordinates;
    sessionStorage.setItem("coor", coordinate);

    document.getElementById("ai-message").innerHTML = "Explore what this location's climate would be like in the next few decades.";
    setLocationSavedStatus();
    setLocationName();

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

      //set alert popup buttons
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

      //set already-saved popup button
      else if (document.getElementById("already-saved")) {
        document.getElementById("saved-back").addEventListener("click", (e) => {
          popup.style.display = "none";
          popup.innerHTML = "";
        });
      }

      //set login popup button
      else {
        document.getElementById("login").addEventListener("click", (e) => {
          popup.style.display = "none";
          popup.innerHTML = "";
        });
      }
    })

  })
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
      .then((response) => { return response.json() })
      .then((response) => { resolve(response) })
      .catch(() => resolve(null))
    // ajaxGET('/getCurrentSearchLocation', (response) => {
    //   try {

    //     resolve(JSON.parse(response));

    //   } catch (error) {
    //     resolve(null);
    //   }
    // });
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

async function setupAI() {
  document.getElementById("ai-button").addEventListener("click", async (e) => {
    let searchLocation = await getCurrentSearchLocation();
    let coorArray = searchLocation ? searchLocation.coordinate : getCoordinateFromSessionStorage();

    if (coorArray) {
      let coor = {
        long: coorArray[0],
        lat: coorArray[1]
      }

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
      let html = "Unable to get location information. Please search the location again."
      document.getElementById("ai-message").innerHTML = html;
    }
  });
}


function getRisks(coor) {
  if (coor) {
    fetch("/getRisks", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(coor),
    })
      .then((response) => { return response.text() })
      .then((response) => {
        //console.log(response)
        document.getElementById("riskContent").innerHTML = response;
      })
      .catch((err) => {
        console.error("Error obtaining risk information")
      })
  } else {
    let message = "<h6 class='alertHeading'>No Location Selected.</h6>";
    document.getElementById("riskContent").innerHTML = message;
  }


}