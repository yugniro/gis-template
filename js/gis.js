var lay = {};

// extend leaflet geoJSON method: draw 1px point radius with label
var pointLayer = L.geoJSON(null, {
    pointToLayer: function(feature,latlng){
        var label = String(feature.properties.name); // attribute: name="text"
        return new L.CircleMarker(latlng, {
            radius: 1
        }).bindTooltip(label, {permanent: true}).openTooltip();
    }
});


function addGeojsonPoints(name, url, map) {
    // add layer from local key-value storage
    if (name in lay) {
        map.addLayer(lay[name]);
        return;
    }

    // load layer over jsonp
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonpCallback: 'parseResponse',
        success: function(data) {
            pointLayer.addData(data);
            map.addLayer(pointLayer);
            lay[name] = pointLayer;
        }
    });
}

function removeGeojsonPoints(name) {
    if (name in lay) {
        map.removeLayer(lay[name]);
    }
}