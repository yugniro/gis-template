$(function(){
    var alertShown = false;

    // visual display hidden elements
    $('.gis-group-layer').on('click', function(e) {
        var clickedTargetName = $(e.target).prop('tagName');
        var clickedTargetClass = $(e.target).prop('class');
        if((clickedTargetName == "INPUT" || clickedTargetName === "LABEL" || clickedTargetName === "A") 
            || clickedTargetClass.indexOf('gis-subgroup') !== -1) {
            return;
        }
        
        var triggerDom = $(this).find('.gis-element-items');
        if (triggerDom.hasClass('d-none')) {
            $('.gis-element-items').addClass('d-none');
        }
        triggerDom.toggleClass('d-none');
    });
    $('.gis-subgroup-lvl1-title').on('click', function(e){
            var targetElement = $(this).parent().find('.gis-subroup-lvl1-content');

            if (targetElement.hasClass('d-none')) {
                $('.gis-subroup-lvl1-content').addClass('d-none');
            }
            targetElement.toggleClass('d-none');
    });

    $('.gis-subgroup-lvl2-title').on('click', function(){
        var tElem = $(this).parent().find('.gis-subgroup-lvl2-content');

        if (tElem.hasClass('d-none')) {
            $('.gis-subgroup-lvl2-content').addClass('d-none');
        }

        tElem.toggleClass('d-none');
    })

    // show warning
    $('#show-warning').on('click', function(){
        if (!alertShown) {
            confirm("Внимание! Данные карты (с сопутствующей атрибутивной информацией) являются схематическим отображением Правил рыболовства и не обладают юридической силой. " +
            "Полный текст Правил рыболовства для Азово-Черноморского рыбохозяйственного бассейна доступен по ссылке: " +
            "http://ivo.garant.ru/#/document/70494670");
            alertShown = true;
        }
    });

    // process geojson data display or hide based on checkbox status
    $('input[type=checkbox]').on('change', function(){
        var checked = $(this).is(':checked');

        var layerName = $(this).attr('data-target');
        var layerType = $(this).attr('data-toggle');
        var layerColor = $(this).attr('data-color');

        // prepare safe name for additional id tree element display
        var layerIdName = layerName.replace(":", "-_-");
        
        if (!layerName || layerName.length < 3 || !layerType || layerType.length < 3) {
            return false;
        }
        
        // process "check all" checkbox features
        if (layerType == "checkall") {
            layerName.split(",").forEach(function(item){
                $('#' + item).prop('checked', checked).trigger('change');
            });
        }

        // process display/hide layers from API geoserver
        if (checked) {
            // if layer is always on the map - do not process action twice
            if (layerName in enabledLayers && enabledLayers[layerName] === true) {
                return true;
            }
            displayLayerType(layerType, layerName, map, layerColor);
            enabledLayers[layerName] = true;
            // display tree button with "more" action
            $(this).parent().find('label').after(" <a href='javascript:void(0)' id='modaltree-"+layerIdName+"' class='modal-tree-display'>🔎</a>");
        } else {
            removeLayer(layerName);
            enabledLayers[layerName] = false;
            $(this).parent().find("a#modaltree-"+layerIdName).remove();
        }
    });
    // process zoom buttons
    $('#gis-zoom-azov').on('click', function(){
        map.setView([46.1, 36.5], 8);
    });
    $('#gis-zoom-blacksea').on('click', function(){
        map.setView([43.8, 36.2], 8);
    });
    $('#gis-zoom-rostov').on('click', function(){
        map.setView([47.2, 39.7], 9);
    });
    $('#gis-zoom-krasnodar').on('click', function(){
        map.setView([45.0, 38.9], 9);
    });
    
    // change tile layer
    $('input[name=gis-tile]:radio').change(function(){
        map.removeLayer(bg);
        var mid = $(this).attr('id');
        if (mid === 'gis-tile-azniirkh') {
            bg = L.tileLayer.wms('https://map.azniirkh.ru/geoserver/azniirkh_zones/wms?', {
                layers: 'base_layer_250_02_egps3857_geotiff',
                attribution: '&copy; <a href="http://azniirkh.ru">AzNIIRKH</a>'
            }).addTo(map);
            map.options.crs = L.CRS.EPSG3857;
        }
        if (mid === 'gis-tile-yandex') {
            bg = L.tileLayer(
              'https://sat{s}.maps.yandex.net/tiles?l=sat&v=3.378.0&z={z}&x={x}&y={y}&lang=ru_RU', {
                subdomains: ['01', '02', '03', '04'],
                attribution: '<a href="https://yandex.ru" target="_blank">Яндекс</a> | <a href="http://azniirkh.ru">АзНИИРХ</a>',
                reuseTiles: true,
                updateWhenIdle: false
              }
            ).addTo(map)
            map.options.crs = L.CRS.EPSG3395;
        }
        if (mid === 'gis-tile-yandex-scheme') {
            bg = L.tileLayer(
              'https://vec{s}.maps.yandex.net/tiles?l=map&v=18.06.17-0&z={z}&x={x}&y={y}&lang=ru_RU', {
                subdomains: ['01', '02', '03', '04'],
                attribution: '<a href="https://yandex.ru" target="_blank">Яндекс</a> | <a href="http://azniirkh.ru">АзНИИРХ</a>',
                reuseTiles: true,
                updateWhenIdle: false
              }
            ).addTo(map)
            map.options.crs = L.CRS.EPSG3395;
        }
        
        var zoomIdx = map.getZoom();
        map.setZoom(zoomIdx+1);
        setTimeout(function(){
            map.setZoom(zoomIdx);
        }, 800);
    });

    // display modal window on icon click
    $(document).on('click', '.modal-tree-display', function(){
        var treeId = $(this).attr('id');
        var layerName = treeId.replace("-_-", ":").replace("modaltree-", "");
        var modal = $('#modalTreeDisplay');
        modal.find('#display-layer-name-span').text(layerName);

        if (lay == 'undefined' || !(layerName in lay)) {
            modal.find('.modal-feature').html('<p>Нет информации о данном слое</p>');
            modal.show();
            return;
        }

        var modalbody = modal.find('.modal-feature');
        var html = '<div class="table-responsive"><table class="table" id="modal-tree-table">';
        html += '<thead><tr><td>Название</td><td>Действия</td></tr></thead>';
        html += '<tbody>';
        
        var lyr = lay[layerName];
        for (var k in lyr._layers) {
            var feature = lyr._layers[k];
            var fulltext = feature._popup.getContent();
            var div = document.createElement('div');
            div.innerHTML = fulltext;
            var text = div.getElementsByTagName('strong')[0].innerText;
            if (text == 'undefined' || text == '') {
                text = 'unknown';
            }

            var featureId = feature.feature.id;
            var action = '<a href="javascript:void(0)" class="moveToLeafletLayer" data-group="'+layerName+'" data-id="layer-' + feature._leaflet_id + '">Просмотр</a>';

            html += '<tr id="tree-row-'+feature._leaflet_id+'"><td class="modal-search-index">' + text + '</td><td>' + action + '</td></tr>';
            //console.log(feature);
        }

        html += '</tbody>';
        html += '</table></div>';

        modalbody.html(html);
        modal.modal('show');
    });

    // process click event on legend features - zoom to layer and show popup
    $(document).on('click', '.moveToLeafletLayer', function(){
        var oid = $(this).attr('data-id').replace('layer-', '');
        var layerName = $(this).attr('data-group');

        var lyr = lay[layerName];
        var found = false;
        for (var k in lyr._layers) {
            var item = lyr._layers[k];
            // found required layer
            if (item._leaflet_id == oid) {
                found = true;
                item.openPopup();
                map.fitBounds(item.getBounds());
                $('#modalTreeDisplay').modal('hide');
            }
        }
    });

    // process modal search
    $('#modal-search-btn').on('click', function(){
        var query = $('#modal-search-field').val();
        if (query == '' || query.length < 3) {
            alert("Запрос слишком короткий!");
            return;
        }
        query = query.toLowerCase();

        var tableSelector = $('#modal-tree-table');
        var foundIdx = 0;
        tableSelector.find('td.modal-search-index').each(function(){
            var row = this.innerText.toLowerCase();
            // check if row contains search query
            if (row.indexOf(query) !== -1) {
                var foundId = $(this).parent().attr('id');
                $(this).parent().addClass('alert-success');
                foundIdx++;
                //$('body').scrollTo('#' + foundId);
            } else {
                $(this).parent().removeClass('alert-success');
            }
        });
        
        $('#modal-found-text').removeClass("d-none");
        $('#modal-found-count').text(foundIdx);
    });
});