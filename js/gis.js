var lay = {};
var owsurl = 'https://map.azniirkh.ru/geoserver/azniirkh_zones/ows';

function displayLayerType(type, name, map, color) {
    var url;
    // check if layer is already loaded
    if (name in lay) {
        map.addLayer(lay[name]);
        return true;
    }

    // geojson -> points
    if (type === 'point' || type === 'points') {
        addGeojsonPoints(name, map, color);
        return true;
    }
    // geojson -> multiline
    if (type === 'multiline' || type === 'lines' || type === 'multilines' || type === 'multipoly' || type === 'poly') {
        addGeojsonGeometryObject(name, map, color);
        return true;
    }


    return false;
}

/**
 * Add leaflet geojson layer from OWS with some geometry: multiline, multipolygon, line, poly
 * @param name
 * @param map
 */
function addGeojsonGeometryObject(name, map, color) {
    $.ajax({
        url: owsurl + '?service=WFS&version=1.0.0&request=GetFeature&typeName=' + name + '&maxFeatures=1000&outputFormat=text/javascript',
        dataType: 'jsonp',
        jsonpCallback: 'parseResponse',
        success: function(data) {
            var layer = L.geoJSON(data, {
                onEachFeature: function(feature, layer) {
                    if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0][0].length >= 4) {
                        var poly = turf.polygon(feature.geometry.coordinates[0]);
                        var parea = turf.area(poly);
                        parea /= 1000000; // km ^ 2
                        if (typeof feature.properties.area == 'undefined') {
                            feature.properties.area = parea.toFixed(2);
                        }
                    }
                    
                    if (feature.properties && feature.properties.name) {
                        var tooltext = String(feature.properties.name);
                        var popuptext = '<strong>' + String(feature.properties.name) + '</strong><br /><p>' + String(feature.properties.desc) + '</p>';
                        if (typeof feature.properties['area'] != 'undefined') {
                            popuptext += '<p>Площадь: ' + feature.properties.area + ' кв.км</p>'; 
                        }
                        //layer.bindTooltip(tooltext, {permanent: true});
                        layer.bindPopup(popuptext);
                    }
                }
            });
            if (typeof(color) !== 'undefined' && color.length >= 3) {
                layer.setStyle({
                    fillColor: color,
                    color: color
                });   
            }
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