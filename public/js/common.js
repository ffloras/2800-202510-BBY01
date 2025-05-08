//for commonly used functions

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