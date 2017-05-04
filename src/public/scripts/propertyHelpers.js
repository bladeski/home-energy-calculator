define(['knockout'], function (ko) {
    var propertyHelpers = {
        markersArray: []
    };

    var apiKey = 'fvxgcw7pvdumvy8d65tk3kns';
    var zooplaQueryUrl = 'http://api.zoopla.co.uk/api/v1/property_listings.js?api_key=' + apiKey;

    /* Function to clear current overlays from Google map */
    function deleteOverlays() {
        if (propertyHelpers.markersArray) {
            for (i in propertyHelpers.markersArray) {
                propertyHelpers.markersArray[i].setMap(null);
            }
            propertyHelpers.markersArray = [];
        }
    }

    function getScale(width, height) {
        var ratio = parseInt(width) / parseInt(height),
            scale = {
                scale: 1,
                anchor: ''
            },
            newWidth, newHeight;

        if (ratio >= 1) { // Square or wide
            newHeight = 16;
            scale.scale = 1 / (height / newHeight);
            scale.anchor = new google.maps.Point(width * scale.scale / 2, newHeight);
        } else {
            newWidth = 16;
            scale.scale = 1 / (width / newWidth);
            scale.anchor = new google.maps.Point(newWidth / 2, height * scale.scale);
        }

        return scale;
    }

    propertyHelpers.getNumberOfBedrooms = function (bedrooms) {

        var numberOfBedrooms = parseInt(bedrooms);

        if (numberOfBedrooms <= 2) {
            return '1 to 2';
        } else if (numberOfBedrooms <= 3) {
            return '3';
        } else {
            return '4 +';
        }
    };

    propertyHelpers.getPropertyType = function (type) {
        var returnType;
        switch (type) {
            case 'End terrace house':
                returnType = 'Terraced';
                break;
            case 'Terraced house':
                returnType = 'Terraced';
                break;
            case 'Semi-detached house':
                returnType = 'Semi-detached';
                break;
            case 'Detached house':
                returnType = 'Detached';
                break;
            case 'Flat':
                returnType = 'Flat';
                break;
            case 'Bungalow':
                returnType = 'Bungalow';
                break;
            default:
                returnType = 'Other';
        }

        return returnType;
    };

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
            var bounds = new google.maps.LatLngBounds();

            if(data.listing.length > 0){

                deleteOverlays();

                data.listing.forEach(function (listing, index) {

                    var icon = {
                            path: '',
                            fillColor: '',
                            fillOpacity: 1,
                            scale: 0.01,
                            strokeColor: '',
                            strokeWeight: 0
                        },
                        iconName,
                        iconDetails,
                        marker,
                        latLong;

                    if (viewModel.icons) {
                        iconName = viewModel.icons.iconMap.find(function (iconType) {
                            return iconType.type === listing.property_type;
                        });

                        if (!iconName || !iconName.iconName) {
                            iconName = {
                                iconName: 'house'
                            };
                        }

                        iconDetails = viewModel.icons.icons.find(function (icon) {
                            return icon.tags[0] === iconName.iconName;
                        });

                        if (iconDetails) {
                            scale = getScale(iconDetails.width, viewModel.icons.height);
                            icon.path = iconDetails.paths[0];
                            icon.fillColor = iconDetails.attrs[0].fill;
                            icon.strokeColor = iconDetails.attrs[0].fill;
                            icon.scale = scale.scale;
                            icon.anchor = scale.anchor;
                        } else {
                            icon = '/images/house-icon.png';
                        }
                    } else {
                        icon = '/images/house-icon.png';
                    }

                    latLong = new google.maps.LatLng(listing.latitude,listing.longitude);
                    marker = new google.maps.Marker({
        				position: latLong,
        				map: map,
        				title: listing.displayable_address,
                        icon: icon,
                        infoContent: '<div class="infoWindow">'+
            				'<p><strong>' + listing.displayable_address + '</strong></p>'+
            				'</div>',
                        listing: listing
        			});
        			propertyHelpers.markersArray.push(marker);

                    bounds.extend(marker.position);

                    /* Adds property details to the marker's infoWindow and calls the markerListener function to place this on the map */

        			var infoWindow = new google.maps.InfoWindow({
        				content: marker.infoContent
        			});

        			marker.addListener('click', function() {
                        infoWindow.open(map, marker);

                        viewModel.setSelectedProperty(marker.listing);

                    });
                });

        		map.fitBounds(bounds);
        	}
        });
    };

    return propertyHelpers;
});
