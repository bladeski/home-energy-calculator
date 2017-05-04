(function() {
    'use strict';

    require.config({
        shim : {
            bootstrap : { deps :['jquery'] }
        },
        paths: {
            jquery: '/lib/jquery/jquery.min',
            bootstrap: '/lib/bootstrap/bootstrap.min',
            knockout: '/lib/knockout/knockout-latest',
            regionHelpers: '/scripts/regionHelpers',
            tariffHelpers: '/scripts/tariffHelpers',
            consumerDataHelpers: '/scripts/consumerDataHelpers',
            propertyHelpers: '/scripts/propertyHelpers'
        }
    });

    requirejs([
        'jquery',
        'knockout',
        'bootstrap',
        'regionHelpers',
        'tariffHelpers',
        'consumerDataHelpers',
        'propertyHelpers'
    ], function($, ko, bootstrap, regionHelpers, tariffHelpers, consumerDataHelpers, propertyHelpers) {

        google.maps.visualRefresh = true;
        var map,
            mapInitialized = false;

        // Initialise the Google Maps map
        function initialize() {
            var mapOptions = {
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);

            // Try HTML5 geolocation
            if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var pos = new google.maps.LatLng(position.coords.latitude,
                        position.coords.longitude);

                        map.setCenter(pos);
                    }, function() {
                        handleNoGeolocation(true);
                    }
                );
            } else {
                // Browser doesn't support Geolocation
                handleNoGeolocation(false);
            }
            mapInitialized = true;
        }

        function handleNoGeolocation(errorFlag) {

            // Reset the map to centre in London, should the geolocation be switched off or not working on the device.
            var options = {
                map: map,
                position: new google.maps.LatLng(51.5171, 0.1062),
                content: content
            };

            var infowindow = new google.maps.InfoWindow(options);
            map.setCenter(options.position);
        }

        function updateCurrentUsage() {
            var consumerData,
                estimatedConsumption;

            if (viewModel.ownerKnowsUsage() === '1') {
                if (viewModel.currentGasUsage() || viewModel.currentElecUsage()) {
                    tariffHelpers.getBestTariff(
                        viewModel.currentGasUsage(),
                        viewModel.currentElecUsage(),
                        viewModel.regionCode(),
                        function (tariff) {
                            viewModel.bestTariff(tariff);
                    });
                }
            } else {
                consumerDataHelpers.getConsumerData(function (consumerData) {
                    consumerDataHelpers.monthlyAverageConsumption(viewModel, consumerData, function (estimatedConsumption) {
                        if (estimatedConsumption.count > 0) {
                            tariffHelpers.getBestTariff(
                                estimatedConsumption.gas,
                                estimatedConsumption.elec,
                                viewModel.regionCode(),
                                function (tariff) {
                                    viewModel.bestTariff(tariff);
                            });
                        } else {
                            viewModel.resultHeaderText('Unfortunately there were no results matching your property.');
                            viewModel.resultBodyText('Please change your options or enter your current energy consumption.')
                        }
                        viewModel.results(estimatedConsumption.count);
                        viewModel.accuracy(estimatedConsumption.accuracy);
                    });
                });

            }
        }

        function updateBuyerCurrentUsage() {
            var consumerData,
                estimatedConsumption;

            consumerDataHelpers.getConsumerData(function (consumerData) {
                consumerDataHelpers.monthlyAverageConsumption(viewModel, consumerData, function (estimatedConsumption) {
                    if (estimatedConsumption.count > 0) {
                        tariffHelpers.getBestTariff(
                            estimatedConsumption.gas,
                            estimatedConsumption.elec,
                            viewModel.regionCode(),
                            function (tariff) {
                                viewModel.bestTariff(tariff);
                        });
                    } else {
                        viewModel.resultHeaderText('Unfortunately there were no results matching your property.');
                        viewModel.resultBodyText('Please change your options or enter your current energy consumption.')
                    }
                    viewModel.results(estimatedConsumption.count);
                });
            });
        }

        var viewModel = {
            isOwner: ko.observable(true),
            currentGasUsage: ko.observable(0),
            currentElecUsage: ko.observable(0),
            regionCode: ko.observable(),
            ownerKnowsUsage: ko.observable('1'),
            propertyType: ko.observable(),
            numberOfBedrooms: ko.observable(),
            numberOfBathrooms: ko.observable(),
            hasCentralHeating: ko.observable(),
            hasLoftInsulation: ko.observable(),
            wallType: ko.observable(),
            propertyAge: ko.observable(),
            hasGas: ko.observable('1'),
            bestTariff: ko.observable(),
            listingStatus: ko.observable('sale'),
            buyerPostcode: ko.observable(),
            minPrice: ko.observable(),
            maxPrice: ko.observable(),
            results: ko.observable(),
            regions: ko.observableArray(),
            tariffs: tariffHelpers.getTariffs(),
            resultHeaderText: ko.observable('£0<small>/month</small>'),
            resultBodyText: ko.observable('Please fill in the form to help us find the best tariff for you.'),
            showTariffDetails: ko.observable(false),
            icons: [],
            propertyTypes: [
                'Detached',
                'Semi-detached',
                'Terraced',
                'Bungalow',
                'Flat',
                'Other'
            ],
            numberOfBedroomsOptions: ['1 to 2', '3', '4 +'],
            propertyAges: [
                'pre 1870',
                '1871 - 1919',
                '1920 - 1945',
                '1946 - 1954',
                '1955 - 1979',
                'post 1980'
            ]
        };

        viewModel.selectedProperty = {
            selected: ko.observable(false),
            description: ko.observable(),
            details_url: ko.observable(),
            displayable_address: ko.observable(),
            image_url: ko.observable(),
            latitude: ko.observable(),
            listing_id: ko.observable(),
            listing_status: ko.observable(),
            longitude: ko.observable(),
            num_bathrooms: ko.observable(),
            num_bedrooms: ko.observable(),
            outcode: ko.observable(),
            price: ko.observable(),
            display_price: ko.pureComputed(function () {
                return parseFloat(viewModel.selectedProperty.price()).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
            }),
            property_type: ko.observable(),
            short_description: ko.observable(),
            status: ko.observable(),
            thumbnail_url: ko.observable()
        }

        viewModel.setSelectedProperty = function (listing) {

            viewModel.selectedProperty.selected(true);
            viewModel.selectedProperty.description(listing.description);
            viewModel.selectedProperty.details_url(listing.details_url);
            viewModel.selectedProperty.displayable_address(listing.displayable_address);
            viewModel.selectedProperty.image_url(listing.image_url);
            viewModel.selectedProperty.latitude(listing.latitude);
            viewModel.selectedProperty.listing_id(listing.listing_id);
            viewModel.selectedProperty.listing_status(listing.listing_status);
            viewModel.selectedProperty.longitude(listing.longitude);
            viewModel.selectedProperty.num_bathrooms(listing.num_bathrooms);
            viewModel.selectedProperty.num_bedrooms(listing.num_bedrooms);
            viewModel.selectedProperty.outcode(listing.outcode);
            viewModel.selectedProperty.price(listing.price);
            viewModel.selectedProperty.property_type(listing.property_type);
            viewModel.selectedProperty.short_description(listing.short_description);
            viewModel.selectedProperty.status(listing.status);
            viewModel.selectedProperty.thumbnail_url(listing.thumbnail_url);

            viewModel.propertyType(propertyHelpers.getPropertyType(listing.property_type));
            viewModel.numberOfBedrooms(propertyHelpers.getNumberOfBedrooms(listing.num_bedrooms));
            viewModel.numberOfBathrooms(listing.num_bathrooms);
            viewModel.hasCentralHeating(null);
            viewModel.hasLoftInsulation(null);
            viewModel.wallType(null);
            viewModel.propertyAge(null);
            viewModel.hasGas(null);

            updateBuyerCurrentUsage();
        };

        viewModel.setOwner = function () {
            viewModel.isOwner(true);
        };

        viewModel.setBuyer = function () {
            viewModel.isOwner(false);
            mapInitialized || initialize();
        };

        viewModel.toggleTariffDetails = function () {
            viewModel.showTariffDetails(!viewModel.showTariffDetails());
        };

        viewModel.setOptionDisable = function(option, item) {
            ko.applyBindingsToNode(option, {disable: item.disable}, item);
        };

        viewModel.propertySearch = function () {
            propertyHelpers.propertySearch(viewModel, map);
        };

        viewModel.selectProperty = function (index) {
            console.log(index);
        };

        viewModel.regionCode.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.currentGasUsage.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.currentElecUsage.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.regionCode.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.ownerKnowsUsage.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.propertyType.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.numberOfBedrooms.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.propertyAge.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.hasGas.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.bestTariff.subscribe(function (newTariff) {
            var headerText = '£' + Math.round(newTariff.total) + '<small>/month</small>',
                bodyText = 'The best tariff that we have found is ' + newTariff.name + ' at around £' + Math.round(newTariff.total) + '/month.<br>This would cost around £' + newTariff.totalGas.toFixed(2) + ' for gas, and £' + newTariff.totalElec.toFixed(2) + ' for electricity.'

            viewModel.resultHeaderText(headerText);
            viewModel.resultBodyText(bodyText);
        });

        regionHelpers.getRegions(function (data) {
            viewModel.regions(data);
        });

        propertyHelpers.getIcons(function (icons) {
            viewModel.icons = icons;
        });

        ko.applyBindings(viewModel);
    });
})();
