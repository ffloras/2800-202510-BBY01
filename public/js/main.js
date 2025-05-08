let searchBar;
let map;

setupSearch();
setupMap();

async function setupSearch() {
const script = document.getElementById('search-js');
// wait for the Mapbox Search JS script to load before using it
script.onload = async function () {

    searchBar = new MapboxGeocoder();
    searchBar.accessToken = await getMapboxToken();
    // set the options property
    // searchBar.options = {
    //   language: 'en',
    //   country: 'CA'
    // }

    document.getElementById('search-bar').appendChild(searchBar);

    // add an event listener to handle the `retrieve` event
    searchBar.addEventListener('retrieve', (e) => {
    const feature = e.detail;
    console.log(feature) // geojson object representing the selected item
    });
}
}

async function setupMap() {
  mapboxgl.accessToken = await getMapboxToken();
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: [-122.95263, 49.26636], // starting position [lng, lat]
    zoom: 9, // starting zoom
  });

  // set the mapboxgl library to use for markers and enable the marker functionality
  searchBar.mapboxgl = mapboxgl
  searchBar.marker = true

  // bind the search box instance to the map instance
  searchBar.bindMap(map)
}
  
