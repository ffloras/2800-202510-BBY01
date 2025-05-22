//used for ajax get requests
function ajaxGET(url, callback) {

  const xhr = new XMLHttpRequest();

  xhr.onload = function () {
    if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
      callback(this.responseText);
    } else {
      console.log(this.status);
    }
  };
  xhr.open("GET", url);
  xhr.send();
}

//variables to check if content has been expanded
let protectExpanded = false;
let planExpanded = false;
let bagExpanded = false;
let insuranceExpanded = false;

//sets event listeners for each expandable content
//updates whether the content has been expandes/minimized
protectExpanded = setContentEventListener('protectHeading', '/flood/protect', 'protectIcon', 'protect', protectExpanded);
planExpanded = setContentEventListener('planHeading', '/flood/plan', 'planIcon', 'plan', planExpanded);
bagExpanded = setContentEventListener('bagHeading', '/flood/bag', 'bagIcon', 'bag', bagExpanded);
insuranceExpanded = setContentEventListener('insuranceHeading', '/flood/insurance', 'insuranceIcon', 'insurance', insuranceExpanded);


//sets event listener for expanding/minimizing content
//Params: headingElement = element id of content heading; route = ajaxGET route; iconElement = element id of +/- icon associated with content
//contentElement = element id of content (for inserting ejs); expanded = boolean variable for status of content (expanded = true)
//Returns: boolean status of content
function setContentEventListener(headingElement, route, iconElement, contentElement, expanded) {
  document.getElementById(headingElement).addEventListener("click", (e) => {
    //ajaxGET used to retrieve the appropriate ejs files from server based on route entered
    ajaxGET(route, (data) => {
      //minimizes content
      if (expanded) {
        document.getElementById(iconElement).src = "/img/plusIcon.png";
        document.getElementById(contentElement).innerHTML = "";
        expanded = false;
      //expands content
      } else {
        document.getElementById(iconElement).src = "/img/minusIcon.png";
        document.getElementById(contentElement).innerHTML = data;
        expanded = true;
      }
      return expanded;
    });
  });
}

