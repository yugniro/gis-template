var lay = {};
var owsurl = 'https://map.azniirkh.ru/geoserver/azniirkh_zones/ows';

function displayLayerType(type, name, map) {
    var url;
    // check if layer is already loaded
    if (name in lay) {
        map.addLayer(lay[name]);
        return true;
    }

    // geojson -> points
    if (type === 'point' || type === 'points') {
        addGeojsonPoints(name, map);
        return true;
    }
    // geojson -> multiline
    if (type === 'multiline' || type === 'lines' || type === 'multilines') {
        addGeojsonLines(name, map);
        return true;
    }


    return false;
}

function addGeojsonLines(name, map) {
    $.ajax({
        url: owsurl + '?service=WFS&version=1.0.0&request=GetFeature&typeName=' + name + '&maxFeatures=1000&outputFormat=text/javascript',
        dataType: 'jsonp',
        jsonpCallback: 'parseResponse',
        success: function(data) {
            var layer = L.geoJSON(data, {
                onEachFeature: function(feature, layer) {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup('<strong>' + feature.properties.name + '</strong><br /><p>' + feature.properties.desc + '</p>');
                    }
                }
            });
            map.addLayer(layer);
            lay[name] = layer;
        }
    })
}

/**
 * Add leaflet layer from OWS geojson response - points
 * @param name
 * @param map
 */
function addGeojsonPoints(name, map) {
    // load layer over jsonp
    $.ajax({
        url: owsurl + '?service=WFS&version=1.0.0&request=GetFeature&typeName=' + name + '&maxFeatures=1000&outputFormat=text/javascript',
        dataType: 'jsonp',
        jsonpCallback: 'parseResponse',
        success: function(data) {
            var layer = L.geoJSON(data, {
                pointToLayer: function(feature, latlng){
                    var lbl = String(feature.properties.name);
                    return new L.CircleMarker(latlng, {
                        radius: 1
                    }).bindTooltip(lbl, {permanent: true}).openTooltip();
                }
            });

            // add layer to map & cache object
            map.addLayer(layer);
            lay[name] = layer;
        }
    });
}

function removeLayer(name) {
    if (name in lay) {
        map.removeLayer(lay[name]);
    }
}