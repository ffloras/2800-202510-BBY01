//for commonly used functions

//returns mapbox access token
async function getMapboxToken() {
  return new Promise((resolve, reject) => {
      ajaxGET("/mapboxToken", (data) => {
          try {
              resolve(JSON.parse(data).token);
          } catch (error){
              reject(error);
          }
      });  
  });
}

//checks if user is logged in
async function isLoggedIn() {
    return new Promise((resolve, reject) => {
        ajaxGET("/authenticated", (data) => {
            try {
                resolve(JSON.parse(data));
            } catch (error) {
                reject(error);
            }
        });
    });
}

function ajaxGET(url, callback) {

  const xhr = new XMLHttpRequest();
  xhr.onload = function () {
      if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
          //console.log('responseText:' + xhr.responseText);
          callback(this.responseText);

      } else {
          console.log(this.status);
      }
  }
  xhr.open("GET", url);
  xhr.send();
}


function ajaxPOST(url, callback, data) {

    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
            callback(this.responseText);
  
        } else {
            console.log(this.status);
        }
    }
    xhr.open("POST", url);
    // make it clear that our call is an AJAX call
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    // we are sending form data, we must inform the server of this
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(data);
  }
