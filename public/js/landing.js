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


function setupSearch() {
const script = document.getElementById('search-js');
// wait for the Mapbox Search JS script to load before using it
script.onload = function () {
    
    const mapboxAccessToken = 'pk.eyJ1IjoiZmZsb3IiLCJhIjoiY21hN2prNHJ0MTZiZTJrb29jM3hodDRmdCJ9.VkVUw5Wb-oRpg7ngrzVXzQ';

    searchBar = new MapboxGeocoder();
    searchBar.accessToken = mapboxAccessToken;
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
  
setupSearch();


