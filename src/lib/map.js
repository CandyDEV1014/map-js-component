import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export class LocationMap {
  constructor(elem, width, height) {
    this.elem = elem;
    this.width = width;
    this.height = height;
    document.getElementById(this.elem).style.width = '100%';
    document.getElementById(this.elem).style.maxWidth = this.width;
    document.getElementById(this.elem).style.height = this.height;
  }

  render(data, metric = 'clicks', method = 'bubble', level = 'city') {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidHJib3QiLCJhIjoiY2s3NmFscm1xMTV0MDNmcXFyOWp1dGhieSJ9.tR2IMHDqBPOf_AeGjHOKFA";

    if (data) {
      let mapData = data.map((point, index) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [
            point.coordinates.longitude,
            point.coordinates.latitude
          ]
        },
        properties: {
          id: index,
          name: point.name,
          clicks: point.metrics.clicks,
          impressions: point.metrics.impressions,
          cost: point.metrics.cost,
          ctr: point.metrics.ctr,
          avg_cpc: point.metrics.avg_cpc,
          conv: point.metrics.conv,
          conv_cost: point.metrics.conv_cost,
          conv_rate: point.metrics.conv_rate,
          conv_value: point.metrics.conv_value,
          conv_per_value: point.metrics.conv_per_value,
          allconv: point.metrics.allconv,
          allconv_cost: point.metrics.allconv_cost,
          allconv_rate: point.metrics.allconv_rate,
          allconv_value: point.metrics.allconv_value,
          allconv_per_value: point.metrics.allconv_per_value
        }
      }));

      const average = mapData.reduce((total, next) => total + next.properties[metric], 0) / mapData.length;
      const min = Math.min(...mapData.map((item) => item.properties[metric]));
      const max = Math.max(...mapData.map((item) => item.properties[metric]));
      
      const map = new mapboxgl.Map({
        container: this.elem,
        style: "mapbox://styles/mapbox/light-v10",
        attributionControl: false,
        renderWorldCopies: false,
        zoom: 1
      });

      // Add navigation controls to the top right of the canvas
      map.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
      }));

      map.once("load", function () {
        // Add our SOURCE
        map.addSource("points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: mapData
          }
        });

        // Add our layer
        if (min == max) {
          if (method == 'color') {
            map.addLayer({
              id: "circles",
              source: "points",
              type: "circle",
              filter: [">", `${metric}`, 0],
              paint: {
                "circle-opacity": 0.75,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#3c8cff",
                "circle-stroke-opacity": 0.75,
                "circle-radius": 12,
                "circle-color": "#3c8cff"
              }
            });
          } else {
            map.addLayer({
              id: "circles",
              source: "points",
              type: "circle",
              filter: [">", `${metric}`, 0],
              paint: {
                "circle-opacity": 0.75,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#3c8cff",
                "circle-stroke-opacity": 0.75,
                "circle-radius": 16,
                "circle-color": "#3c8cff"
              }
            });
            
            map.addLayer({
              id: "cluster-count",
              type: "symbol",
              source: "points",
              filter: [">", `${metric}`, 0],
              layout: {
                "text-field": ["get", `${metric}`],
                "text-font": ["Arial Unicode MS Regular"],
                "text-size": 11,
              }
            });
          }
        } else {
          if (method == 'color') {
            map.addLayer({
              id: "circles",
              source: "points",
              type: "circle",
              filter: [">", `${metric}`, 0],
              paint: {
                "circle-opacity": 0.75,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#3c8cff",
                "circle-stroke-opacity": 0.75,
                "circle-radius": 12,
                "circle-color": [
                  "interpolate",
                  ["linear"],
                  ["get", `${metric}`],
                  min,
                  "#c3e3ff",
                  max,
                  "#3c8cff"
                ]
              }
            });
          } else {
            map.addLayer({
              id: "circles",
              source: "points",
              type: "circle",
              filter: [">", `${metric}`, 0],
              paint: {
                "circle-opacity": 0.75,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#3c8cff",
                "circle-stroke-opacity": 0.75,
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["get", `${metric}`],
                  // 1,
                  // min,
                  average / 16,
                  4,
                  average / 8,
                  8,
                  average / 4,
                  12,
                  average / 2,
                  16,
                  average,
                  20,
                  max,
                  30
                ],
                "circle-color": "#3c8cff"
              }
            });
            
            map.addLayer({
              id: "cluster-count",
              type: "symbol",
              source: "points",
              filter: [">=", `${metric}`, average / 4],
              layout: {
                "text-field": ["get", `${metric}`],
                "text-font": ["Arial Unicode MS Regular"],
                "text-size": 11,
              }
            });
          }
        }
        
        
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        let lastId;

        map.on("mousemove", "circles", (e) => {
          const id = e.features[0].properties.id;

          if (id !== lastId) {
            lastId = id;
            const {
              name,
              clicks,
              impressions,
              cost,
              ctr,
              avg_cpc,
              conv,
              conv_cost,
              conv_rate,
              conv_value,
              conv_per_value,
              allconv,
              allconv_cost,
              allconv_rate,
              allconv_value,
              allconv_per_value
            } = e.features[0].properties;

            // Change the pointer type on mouseenter
            map.getCanvas().style.cursor = "pointer";

            const coordinates = e.features[0].geometry.coordinates.slice();
            
            const HTML1 = `
              <h4>Location: ${name}</h4>
              <div class="mapboxgl-popup-row">
                <div class="mapboxgl-popup-col">
                  <div class="mapboxgl-popup-item"><span>Clicks:</span><span>${clicks}</span></div>
                  <div class="mapboxgl-popup-item"><span>Impressions:</span><span>${impressions}</span></div>
                  <div class="mapboxgl-popup-item"><span>Cost:</span><span>${cost}</span></div>
                  <div class="mapboxgl-popup-item"><span>CTR:</span><span>${ctr}%</span></div>
                  <div class="mapboxgl-popup-item"><span>Average CPC:</span><span>${avg_cpc}</span></div>
                </div>
                <div class="mapboxgl-popup-col">
                  <div class="mapboxgl-popup-item"><span>Conv:</span><span>${conv}</span></div>
                  <div class="mapboxgl-popup-item"><span>Cost/conv:</span><span>${conv_cost}</span></div>
                  <div class="mapboxgl-popup-item"><span>Conv.rate:</span><span>${conv_rate}%</span></div>
                  <div class="mapboxgl-popup-item"><span>Conv.value:</span><span>${conv_value}</span></div>
                  <div class="mapboxgl-popup-item"><span>Value per conv:</span><span>${conv_per_value}</span></div>
                </div>
                <div class="mapboxgl-popup-col">
                  <div class="mapboxgl-popup-item"><span>All conv:</span><span>${allconv}</span></div>
                  <div class="mapboxgl-popup-item"><span>Cost/all conv:</span><span>${allconv_cost}</span></div>
                  <div class="mapboxgl-popup-item"><span>All conv.rate:</span><span>${allconv_rate}%</span></div>
                  <div class="mapboxgl-popup-item"><span>All conv.value:</span><span>${allconv_value}</span></div>
                  <div class="mapboxgl-popup-item"><span>Value per all conv:</span><span>${allconv_per_value}</span></div>
                </div>
              </div>
            `;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup.setLngLat(coordinates).setHTML(HTML1).addTo(map);
          }
        });

        map.on("mouseleave", "circles", function () {
          lastId = undefined;
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
      });
      
    }
  }
}
