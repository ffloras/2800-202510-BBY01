//document.addEventListener("DOMContentLoaded", () => {
// const searchBtn = document.getElementById("searchBtn");
// const loginBtn = document.getElementById("loginBtn");
//const storiesBtn = document.getElementById("storiesBtn");


// Handle address search
// searchBtn.addEventListener("click", () => {
//     const address = document.getElementById("addressInput").value.trim();
//     if (address) {
//         const encodedAddress = encodeURIComponent(address);
//         window.location.href = `main.html?address=${encodedAddress}`;
//     } else {
//         alert("Please enter a valid address.");
//     }
// });

// Handle login navigation
// loginBtn.addEventListener("click", () => {
//     window.location.href = "login.html";
// });

// Handle stories navigation
//     storiesBtn.addEventListener("click", () => {
//         window.location.href = "stories.html";
//     });
// });


setupSearch();

//sets up Mapbox search bar
async function setupSearch() {
    const script = document.getElementById('search-js');

    // wait for the Mapbox Search JS script to load before using it
    script.onload = async function () {

        let searchBar = new MapboxGeocoder();
        searchBar.accessToken = await getMapboxToken();
        // set the options property
        // searchBar.options = {
        //   language: 'en',
        //   country: 'CA'
        // }

        document.getElementById('search-bar').appendChild(searchBar);

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

            //stores coordinate in sessionStorage
            sessionStorage.setItem("coor", feature.geometry.coordinates);
            window.location.replace(`/main`); 
        });
    };

    console.log(await isLoggedIn());
}









