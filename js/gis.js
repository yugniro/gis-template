// remember to enable JSONP in /tomcat/webapps/geoserver/WEB-INF/web.xml, uncomment ENABLE_JSONP section

var lay = {};
var owsurl = 'https://map.azniirkh.ru/geoserver/';

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
	
	// process multiple layer links at one iteration
	// format name: {namespace:layer1,type;namespace:layer2,type}
	if (type === 'array' || type === 'multilayer') {
		if (name.indexOf(';') === -1) {
			alert("Multilayer object contains no comma separator");
			return false;
		}
		var layerArray = name.split(';');
		for(var i = 0; i < layerArray.length; i++) {
			var newLayerName = layerArray[i];
			var newLayerType = 'poly';
			if (newLayerName.indexOf(',') > 0) {
				var newTypeName = newLayerName.split(',');
				newLayerName = newTypeName[0];
				newLayerType = newTypeName[1];
			}
			//console.log(newLayerName + '->' + newLayerType);
			displayLayerType(newLayerType, newLayerName, map, color);
		}
	}

    return false;
}

/**
 * Add leaflet geojson layer from OWS with some geometry: multiline, multipolygon, line, poly
 * @param name
 * @param map
 */
function addGeojsonGeometryObject(name, map, color) {
    var namespace = name.split(':')[0];
    $.ajax({
        url: owsurl + namespace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + name + '&maxFeatures=10000&outputFormat=text/javascript',
        dataType: 'jsonp',
        jsonpCallback: 'parseResponse',
        success: function(data) {
            var layer = L.geoJSON(data, {
                onEachFeature: function(feature, layer) {
                    console.log('feature parsing begin');
                    
                    if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0][0].length >= 4) {
                        console.log(feature.properties["area_sq_km"]);
                        if (feature.properties && feature.properties["area_sq_km"] && (typeof feature.properties["area_sq_km"] != "undefined")) {
                            feature.properties.area = feature.properties["area_sq_km"];
                        } else {
                            var poly = turf.polygon(feature.geometry.coordinates[0]);
                            var parea = turf.area(poly);
                            parea /= 1000000; // km ^ 2
                            if (typeof feature.properties.area == 'undefined') {
                                feature.properties.area = parea.toFixed(2);
                            }
                        }
                    }
                    
                    if (feature.properties && feature.properties.name) {
                        var tooltext = String(feature.properties.name);
                        var popuptext = '<strong>' + String(feature.properties.name) + '</strong>';
						if (feature.properties.desc) {
							popuptext += '<br /><p>' + String(feature.properties.desc) + '</p>';
                        }
                        // parse rivers length if attribute "length_km" is exist and .len > 0
                        if (typeof feature.properties['length_km'] != 'undefined') {
                            if (feature.properties.length_km > 0) {
                                popuptext += '<p>Протяженность: ' + feature.properties.length_km + 'км</p>';
                            }
                        } else if (typeof feature.properties['area'] != 'undefined') { // check if object area attribute is defined or calculateds
                            popuptext += '<p>Площадь: ' + feature.properties.area + ' кв.км</p>';              
                        }

                        if (typeof feature.properties['biores'] != 'undefined' && feature.properties.biores.length > 0) {
                            popuptext += '<p>Ихтиофауна: ' + feature.properties.biores;
                            if (typeof feature.properties['biores1'] != 'undefined' && feature.properties.biores1.length > 0) {
                                popuptext += ' ' + feature.properties.biores1;
                            }
                            popuptext += '</p>';
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
    var namespace = name.split(':')[0];
    // load layer over jsonp
    $.ajax({
        url: owsurl + namespace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + name + '&maxFeatures=10000&outputFormat=text/javascript',
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
	if (name.indexOf(';') > 0) {
		var layerArray = name.split(';');
		for (var i = 0; i < layerArray.length; i++) {
			var newLayerName = layerArray[i];
			if (newLayerName.indexOf(',') > 0) {
				var newTypeName = newLayerName.split(',');
				newLayerName = newTypeName[0];
			}
			// recursion call for clear name
			removeLayer(newLayerName);
		}
	} else {
		if (name in lay) {
			map.removeLayer(lay[name]);
		}
	}
}