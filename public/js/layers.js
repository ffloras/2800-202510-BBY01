fetch('/mapboxToken')
    .then(response => response.json())
    .then(data => {
        mapboxgl.accessToken = data.token; // Set the Mapbox access token

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-123, 49],
            zoom: 8
        });

        map.on('load', () => {
            map.addSource('wms-source-2', {
                type: 'raster',
                tiles: [
                    'https://openmaps.gov.bc.ca/geo/pub/WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP/ows?service=WMS&request=GetMap&version=1.3.0&layers=pub:WHSE_LAND_AND_NATURAL_RESOURCE.PROT_DANGER_RATING_SP&styles=&format=image/png&transparent=true&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });

            map.addLayer({
                id: 'wms-layer-2',
                type: 'raster',
                source: 'wms-source-2',
                paint: {}
            });

            map.addSource('air-temp-layer', {
                type: 'geojson',
                data: '/20250509T00Z_MSC_RDPS-UMOS-MLR_AirTemp_AGL-1.5m_PT000H.json' // Path to the JSON file
            });

            map.addLayer({
                id: 'air-temp-layer',
                type: 'circle',
                source: 'air-temp-layer',
                paint: {
                    'circle-radius': 5,
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'forecast_value'],
                        -30, '#0000FF',
                        0, '#00FF00',
                        30, '#FF0000'
                    ],
                    'circle-opacity': 0.8
                }
            });

            map.on('click', 'air-temp-layer', (e) => {
                const features = e.features[0];
                const properties = features.properties;

                const forecastValueK = properties.forecast_value;
                const forecastValueC = forecastValueK !== undefined ? (forecastValueK - 273.15).toFixed(2) : undefined;

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(`<h3>Forecast Value</h3><p>${forecastValueC !== undefined ? `${forecastValueC} °C` : 'No data available'}</p>`) // Display the forecast value in Celsius
                    .addTo(map);
            });

            map.on('mouseenter', 'air-temp-layer', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'air-temp-layer', () => {
                map.getCanvas().style.cursor = '';
            });

            map.addSource('geojson-source', {
                type: 'circle',
            });

            map.addSource('wms-temperature-layer', {
                type: 'raster',
                tiles: [
                    'https://geo.weather.gc.ca/geomet?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&BBOX=-90,-180,90,180&CRS=EPSG:4326&WIDTH=600&HEIGHT=301&LAYERS=GDPS.ETA_TT&FORMAT=image/png'
                ],
                tileSize: 256
            });

            map.addLayer({
                id: 'wms-temperature-layer',
                type: 'raster',
                source: 'wms-temperature-layer',
                paint: {}
            });
        });

        map.on('idle', () => {
            const toggleableLayerIds = ['wms-layer-2', 'air-temp-layer', 'wms-temperature-layer'];

            for (const id of toggleableLayerIds) {
                if (document.getElementById(id)) {
                    continue;
                }

                const link = document.createElement('a');
                link.id = id;
                link.href = '#';
                link.textContent = id;
                link.className = 'active';

                link.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const visibility = map.getLayoutProperty(id, 'visibility');

                    if (visibility === 'visible') {
                        map.setLayoutProperty(id, 'visibility', 'none');
                        this.className = '';
                    } else {
                        map.setLayoutProperty(id, 'visibility', 'visible');
                        this.className = 'active';
                    }
                };

                const menu = document.getElementById('menu');
                menu.appendChild(link);
            }
        });

        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },

                trackUserLocation: true,

                showUserHeading: true
            })
        );

        map.on('click', (e) => {
            const bbox = map.getBounds().toArray().flat();
            const width = map.getCanvas().width;
            const height = map.getCanvas().height;

            const x = Math.round((e.point.x / width) * 256);
            const y = Math.round((e.point.y / height) * 256);

            const url = `https://geo.weather.gc.ca/geomet-climate?version=1.3.0&service=WMS&request=GetFeatureInfo&layers=CMIP6-SSP370_SnowDepthAnomaly-Pct50_2041-2060_P0Y&styles=SNOWDEPTH-ANOMALY&format=image/png&transparent=true&query_layers=CMIP6-SSP370_SnowDepthAnomaly-Pct50_2041-2060_P0Y&info_format=application/json&crs=EPSG:3857&i=${x}&j=${y}&width=256&height=256&bbox=${bbox.join(',')}`;

            fetch(url)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    const summary = document.getElementById('summary');
                    if (data && data.features && data.features.length > 0) {
                        const feature = data.features[0];
                        summary.innerHTML = `<h3>Feature Information</h3><p>${JSON.stringify(feature.properties)}</p>`;
                    } else {
                        summary.innerHTML = `<h3>Feature Information</h3><p>No data available at this location.</p>`;
                    }
                })
                .catch((error) => {
                    const summary = document.getElementById('summary');
                    summary.innerHTML = `<h3>Feature Information</h3><p>Error fetching data.</p>`;
                });
        });
    })
    .catch(error => {
        console.error('Error fetching Mapbox token:', error);
    });








