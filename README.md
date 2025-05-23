# RiskMapper

## Overview

RiskMapper is a climate risk visualization web application that enables users to identify, understand, and share information about environmental threats in their region. Using real-time geospatial data from official sources, the app visualizes environmental risks through interactive map layers and provides actionable climate adaptation tips.

The platform also empowers community storytelling by allowing users to share their personal experiences with climate events. Developed as part of the BCIT CST Program, this project follows Agile methodologies and user-centered design principles, integrating a robust backend with a responsive, data-rich frontend.

## Features

- **Search Location**: Quickly find your city or neighborhood to view local environmental risks.
- **Dynamic Map Layers**: Toggle between climate hazard layers (e.g., flooding, heatwaves, wildfire).
- **Save Location**: Save your preferred location to receive relevant climate alerts.
- **Adaptation Tips**: Access practical, region-specific advice for mitigating environmental risks.
- **Community Stories**: Share your experiences and learn how others are affected by climate change.

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

## Usage

1. **Visit the Web App**: Open the RiskMapper app hosted on Render.
2. **Search a Location**: Use the search bar to locate your city or area.
3. **View Map Layers**: Toggle between different environmental hazard layers.
4. **Save Location**: Bookmark your area to receive climate alerts.
5. **Check Tips**: Get customized advice on how to prepare for local risks.
6. **Tell Your Story**: Submit your experience and view stories from others affected by climate change.

## Contributors

- **Justin Yu** – Set 1D, BCIT CST Student  
- **Shaz Uqaili** – Set 1A, BCIT CST Student  
- **Fahua (Flora) Su** – Set 1D, BCIT CST Student  
- **Hali Imanpanah** – Set 1A, BCIT CST Student  

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
