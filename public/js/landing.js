//sets up Mapbox searchbar
setupSearch();

//sets up Mapbox search bar and saves search location
async function setupSearch() {
    const script = document.getElementById('search-js');

    // wait for the Mapbox Search JS script to load before using it
    script.onload = async function () {

        let searchBar = new MapboxGeocoder();
        searchBar.accessToken = await getMapboxToken();

        document.getElementById('search-bar').appendChild(searchBar);

        // add an event listener to retrieve coordinates of searched location
        searchBar.addEventListener('retrieve', async (e) => {
            const feature = e.detail; // geojson object representing the selected item

            //save search location in db
            const response = await fetch('/recordCurrentLocation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentLocation: feature }),
            });

            //stores coordinate in sessionStorage
            sessionStorage.setItem("coor", feature.geometry.coordinates);
            window.location.replace(`/main`); 
        });
    };
}









