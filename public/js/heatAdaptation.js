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
let atRiskExpanded = false;
let buddyExpanded = false;
let prepareExpanded = false;
let indoorsExpanded = false;
let outdoorsExpanded = false;
let overheatExpanded = false;
let wildfireExpanded = false;
let droughtExpanded = false;

//sets event listeners for each expandable content
//updates whether the content has been expandes/minimized
atRiskExpanded = setContentEventListener('atRiskHeading', '/heat/atRisk', 'atRiskIcon', 'atRisk', atRiskExpanded);
buddyExpanded = setContentEventListener('buddyHeading', '/heat/buddy', 'buddyIcon', 'buddy', buddyExpanded);
prepareExpanded = setContentEventListener('prepareHeading', '/heat/prepare', 'prepareIcon', 'prepare', prepareExpanded);
indoorsExpanded = setContentEventListener('indoorsHeading', '/heat/indoors', 'indoorsIcon', 'indoors', indoorsExpanded);
outdoorsExpanded = setContentEventListener('outdoorsHeading', '/heat/outdoors', 'outdoorsIcon', 'outdoors', outdoorsExpanded);
overheatExpanded = setContentEventListener('overheatHeading', '/heat/overheat', 'overheatIcon', 'overheat', overheatExpanded);
wildfireExpanded = setContentEventListener('wildfireHeading', '/heat/wildfire', 'wildfireIcon', 'wildfire', wildfireExpanded);
droughtExpanded = setContentEventListener('droughtHeading', '/heat/drought', 'droughtIcon', 'drought', droughtExpanded);




//sets event listener for expanding/minimizing content
//Params: headingElement = element id of content heading; route = ajaxGET route; iconElement = element id of +/- icon associated with content
//contentElement = element id of content (for inserting ejs); expanded = boolean status of content (true if expanded))
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

