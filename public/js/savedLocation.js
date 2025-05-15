displaySavedLocations();

async function displaySavedLocations() {
  let popup = document.getElementById("popup-overlay");
  popup.style.display = "none";
  popup.innerHTML = "";

  try {
    //display list of saved locations
    let response = await fetch("/displaySavedLocations");
    let html = await response.text();
    document.getElementById("save-container").innerHTML = html;

    //add event listeners to alert/delete buttons
    let buttonArray = document.querySelectorAll(".location-button");
    buttonArray.forEach((button) => {
      button.addEventListener("click", async (e) => {
        let [id, type] = e.target.getAttribute('id').split('-');

        //add popup to confirm deletion
        if (type == "remove") {
          let alertOn = e.target.classList.contains("alert-on");
          let popupResponse = await fetch("/deletePopup");
          let popupHtml = await popupResponse.text();
          popup.style.display = "flex";
          popup.innerHTML = popupHtml;

          //delete location if 'yes' is selected
          document.getElementById("yes-delete").addEventListener("click", (e) => {
            fetch("/deleteLocation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locationId: id, alertOn: alertOn })
            })
              .then((response) => {
                if (response.ok) {
                  displaySavedLocations();
                }
              })
              .catch((error) => {
                console.error("Unable to delete location: ", error)
              })
            popup.style.display = "none";
            popup.innerHTML = "";
          })

          //removes popup if "no" is selected
          document.getElementById("no-delete").addEventListener("click", (e) => {
            popup.style.display = "none";
            popup.innerHTML = "";
          })
        }

        //updates alert if alert button is selected
        if (type == "alert") {
          let newAlert = !e.target.classList.contains("alert-on");
          
          fetch("/updateAlert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locationId: id, newAlert: newAlert })
          })
            .then((response) => {
              if (response.ok) {
                displaySavedLocations();
              }
            })
            .catch((error) => {
              console.error("Unable to update alert location: ", error)
            });
        }
      });
    })
  } catch (error) {
    console.error("Error fetching saved locations: ", error);
  }
}