setupMapbox();

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
    
    let map = new mapboxgl.Map({
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

    //sets up the initial search from index.html
    searchLocation(map, getCoordinateFromURL());
  }
}

//params: map object, coordinate array consisting of longitude and latitude
function searchLocation(map, coordinate) {
  if (coordinate) {
    map.flyTo({center: coordinate, zoom: 11});
  }
}

//return coordinate array consisting of longitude and latitude
function getCoordinateFromURL() {
  let url = new URL(window.location.href);
  let params = url.searchParams.get("coor");  
  let coor = null;
  if (params) {
    coor = params.split(",");
    console.log(coor);
  }
  return coor;
}
