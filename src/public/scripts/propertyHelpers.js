define(['knockout'], function (ko) {
    var propertyHelpers = {
        markersArray: []
    };

    var apiKey = 'fvxgcw7pvdumvy8d65tk3kns';
    var zooplaQueryUrl = 'http://api.zoopla.co.uk/api/v1/property_listings.js?api_key=' + apiKey;

    function markerListener(marker, infoWindow, map)
    {
        // so marker is associated with the closure created for the listenMarker function call
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.open(map, marker);
        });
    }

    /* Function to clear current overlays from Google map */
    function deleteOverlays() {
        if (propertyHelpers.markersArray) {
            for (i in propertyHelpers.markersArray) {
                propertyHelpers.markersArray[i].setMap(null);
            }
            propertyHelpers.markersArray = [];
        }
    }


    propertyHelpers.getProperties = function (queryString, callback) {

        $.ajax({
            url: zooplaQueryUrl + queryString,
            dataType: 'jsonp',
            jsonp: 'jsonp'
        }).done(function (data) {
            callback && callback(data);
        }).fail(function (data, status) {
            console.log(status);
        });

    };

    propertyHelpers.getIcons = function (callback) {
        $.ajax({
            url: '/data/propertyIcons.json'
        }).done(function (data) {
            callback && callback(data);
        })
    };

    propertyHelpers.propertySearch = function (viewModel, map) {
        var postcode = viewModel.buyerPostcode(),
            listingStatus = viewModel.listingStatus(),
            minPrice = viewModel.minPrice(),
            maxPrice = viewModel.maxPrice(),
            querySring;

        if (postcode && listingStatus) {
            querySring = '&postcode=' + postcode + '&radius=2&page_size=20&listing_status=' + listingStatus;
            querySring += minPrice ? '&minimum_price=' + minPrice : '';
            querySring += minPrice ? '&maximum_price=' + maxPrice : '';
        }

        propertyHelpers.getProperties(querySring, function (data) {
            var latLong,
                marker,
                bounds = new google.maps.LatLngBounds();

            if(data.listing.length > 0){

                deleteOverlays();
                
                data.listing.forEach(function (listing, index) {

                    var icon = '/images/house-icon.png',
                        iconName;

                    if (viewModel.icons.length > 0) {
                        iconName = viewModel.icons.find(function (icon) {
                            return icon.Type === listing.property_type;
                        });

                        icon = iconName ? '/images/' + iconName.IconName : icon;
                    }

                    latLong = new google.maps.LatLng(listing.latitude,listing.longitude);
                    marker = new google.maps.Marker({
        				position: latLong,
        				map: map,
        				title: listing.displayable_address,
                        icon: icon
        			});
        			propertyHelpers.markersArray.push(marker);

                    bounds.extend(marker.position);

                    /* Adds property details to the marker's infoWindow and calls the markerListener function to place this on the map */
        			contentString = '<div class="infoWindow">'+
        				'<p><strong>' + listing.displayable_address + '</strong></p>'+
        				'<p>' + listing.short_description + '</p>'+
        				'<p><a href="' + listing.details_url + '" target=_blank">more details on the Zoopla website...</a></p>'+
        				'<p><a href="#" onclick="selectProperty(' + index + ')">select property for your energy calculation...</a></p>'+
        				'</div>';
        			var infoWindow = new google.maps.InfoWindow({
        				content: contentString
        			});

        			markerListener(marker, infoWindow);
                });

        		map.fitBounds(bounds);
        	}
        });
    };

    return propertyHelpers;
});
