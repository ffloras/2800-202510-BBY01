# RiskMapper

## Overview

RiskMapper is a climate risk visualization web application that enables users to identify, understand, and share information about environmental threats in their region. Using real-time geospatial data from official sources, the app visualizes environmental risks through interactive map layers and provides actionable climate adaptation tips.

The platform also empowers community storytelling by allowing users to share their personal experiences with climate events. Developed as part of the BCIT CST Program, this project follows Agile methodologies and user-centered design principles, integrating a robust backend with a responsive, data-rich frontend.

## Technologies Used

- **Frontend**: EJS, JavaScript, CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Package Management**: NPM
- **Hosting**: Render
- **Mapping & Data APIs**:
  - [Mapbox](https://www.mapbox.com/) – for rendering dynamic, interactive maps
  - [MSC GeoMet API](https://www.canada.ca/en/environment-climate-change/services/weather-general-tools-resources/weather-tools-specialized-data/msc-geomet-api-geospatial-web-services.html) – for accessing Environment Canada climate data
  - [WeatherAPI](https://www.weatherapi.com/) – for real-time weather conditions and forecasts
- **AI**: Google Gemini GenAI


## File Structure
```
2008-202510-BBY01
├─ databaseConnection.js            # used for connection with mogodb database
├─ index.js                         # server side code
├─ package-lock.json
├─ package.json
├─ public                           # contains css, js and img folders
│  ├─ css
│  │  ├─ detailStory.css
│  │  ├─ landing.css
│  │  ├─ load.css
│  │  ├─ login.css
│  │  ├─ main.css
│  │  ├─ myStories.css
│  │  ├─ postStory.css
│  │  ├─ profile.css
│  │  ├─ riskAdaptation.css
│  │  ├─ savedLocation.css
│  │  └─ stories.css
│  ├─ img
│  │  ├─ alertOffIcon.png
│  │  ├─ alertOnIcon.png
│  │  ├─ deleteIcon.png
│  │  ├─ floodRiskIcon.png
│  │  ├─ heatRiskIcon.png
│  │  ├─ lightbulb.png
│  │  ├─ minusIcon.png
│  │  ├─ plusIcon.png
│  │  ├─ RiskMapper.png
│  │  ├─ saveIconChecked.png
│  │  └─ saveIconUnchecked.png
│  └─ js
│     ├─ common.js
│     ├─ detailStory.js
│     ├─ floodAdaptation.js
│     ├─ heatAdaptation.js
│     ├─ landing.js
│     ├─ load.js
│     ├─ main.js
│     ├─ myStories.js
│     ├─ postStory.js
│     ├─ profile.js
│     ├─ savedLocation.js
│     └─ stories.js
├─ README.md
├─ uploads                          # For multer images
└─ views                            # Contains ejs files
   ├─ 404.ejs
   ├─ detailStory.ejs
   ├─ errors.ejs
   ├─ flood                        
   │  ├─ floodBag.ejs
   │  ├─ floodInsurance.ejs
   │  ├─ floodPlan.ejs
   │  └─ floodProtect.ejs
   ├─ floodAdapt.ejs
   ├─ heat
   │  ├─ heatAtRisk.ejs
   │  ├─ heatBuddy.ejs
   │  ├─ heatDrought.ejs
   │  ├─ heatIndoors.ejs
   │  ├─ heatOutdoors.ejs
   │  ├─ heatOverheating.ejs
   │  ├─ heatPrepare.ejs
   │  └─ heatWildfire.ejs
   ├─ heatAdapt.ejs
   ├─ index.ejs
   ├─ login.ejs
   ├─ main
   │  ├─ alertPopup.ejs
   │  ├─ loginPopup.ejs
   │  ├─ risks.ejs
   │  └─ savedPopup.ejs
   ├─ main.ejs
   ├─ myStories.ejs
   ├─ policy.ejs
   ├─ postStory.ejs
   ├─ profile.ejs
   ├─ savedLocation.ejs
   ├─ savedLocations
   │  ├─ deletePopup.ejs
   │  └─ location.ejs
   ├─ signup.ejs
   ├─ stories.ejs
   └─ templates
      ├─ footer.ejs
      └─ header.ejs

```

## Features

- **Search Location**: Quickly find your city or neighborhood to view local environmental risks.
- **Dynamic Map Layers**: Toggle between climate hazard layers (e.g., flooding, heatwaves, wildfire).
- **Save Location**: Save your preferred location to receive relevant climate alerts.
- **Adaptation Tips**: Access practical, region-specific advice for mitigating environmental risks.
- **Community Stories**: Share your experiences and learn how others are affected by climate change.


## Usage

1. **Visit the Web App**: Open the RiskMapper app hosted on Render.
2. **Search a Location**: Use the search bar to locate your city or area.
3. **View Map Layers**: Toggle between different environmental hazard layers.
4. **Save Location**: Bookmark your area to receive climate alerts.
5. **Check Tips**: Get customized advice on how to prepare for local risks.
6. **Tell Your Story**: Submit your experience and view stories from others affected by climate change.


## How to Install and Run the Project

**Softwares to install**
- NodeJS
- Visual Studio Code, or another IDE
- MongoDB

**3rd party API and frameworks**
- None

**API keys**
- Mapbox
- GenAI
- Weather API
- EmailJS

**Order to install**
- Can be installed in any order

**Configuration Instructions**
- Run command “npm i” in the source folder to install modules/packages
- Setup .env file containing database and session info, and api keys

**Testing Plan**
https://docs.google.com/spreadsheets/d/1pb2PikBKqRC3UPss8Myp8aDfC0KF7-BGoHHHOs5u-2M/edit?usp=sharing


## AI or APIs

**Mapbox Geocoding API used to create the search bar for users to search their locations**

- Connected using Mapbox CDN
- Connects with Mapbox map to display location on map
- Returns geojson location object of search location that is then either stored in database or parsed to obtain location information

**Mapbox Map API is used to create a map on the front end**
- Connected using Mapbox CDN
- Provides access to their proprietary mapping tiles, that can be used to visualize various geographic features

**MSC GeoMET API is used to obtain climate layers from Environmental Canada web map services**
- The GeoMET API uses WMS that provides a JSON link that can also be parsed and used as a source. There are multiple features within the JSON that can be used as features, which are added as layers within Mapbox.

**Weather API is used to obtain climate alerts from searched locations**
- Response is fetched using Weather API’s url containing the coordinates of the searched location
- The response a json object containing the alerts report sent by the environmental agency of that location
- The json is then parsed to obtain the specific alert information used for the app

**EmailJS is used to create templates for and send emails to user accounts**
- The email template is created on EmailJS’ website.
- The email API is used to send emails to users with data passed to the template

**GenAI API is used to generate future climate response for the searched location**
- GenAI has a node module that can be installed
- A request is sent to GenAI’s url which includes a prompt with the searched location’s coordinates
- The response is converted to text and displayed on the home page


## Contributors

- **Justin Yu** – Set 1D, BCIT CST Student  
- **Shaz Uqaili** – Set 1A, BCIT CST Student  
- **Fahua (Flora) Su** – Set 1D, BCIT CST Student  
- **Hali Imanpanah** – Set 1A, BCIT CST Student  


**Contact Us**: riskmapperapp@gmail.com


## References and Credits

- Icons from icon8: https://icons8.com/
- Heat and Flood adaptation icons from vecteezy:  https://www.vecteezy.com/
- App Logo from wix.com & Canva.com


## Acknowledgments

- Environmental and weather data provided by **MSC GeoMet** and **WeatherAPI**.
- Mapping support by **Mapbox**.
- UI/UX planning and component prototyping aided by **ChatGPT**.
- Agile development managed via **GitHub Projects**.
- Hosted on **Render**.


## Limitations and Future Work

### Limitations

- Environmental datasets are limited to the coverage provided by MSC GeoMet.
- No native mobile app; currently optimized for web browsers only.
- Real-time alerts are limited to saved locations and require internet access.

### Future Work

- **Mobile App Development**: Launch native apps for iOS and Android platforms.
- **Push Notifications**: Implement real-time alerts via web push or mobile notifications.
- **Expanded Dataset Integration**: Include air quality, drought, and other relevant environmental factors.
- **User Profiles**: Enable users to manage saved locations, preferences, and story history.
- **Multilingual Support**: Add French and other languages for wider accessibility.

