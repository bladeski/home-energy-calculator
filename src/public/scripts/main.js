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

        function calculateConsumption(consumerData) {
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
        }

        function updateCurrentUsage() {
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
                if (viewModel.consumerData) {
                    calculateConsumption(viewModel.consumerData);
                } else {
                    consumerDataHelpers.getConsumerData(function (consumerData) {
                        calculateConsumption(consumerData);
                    });
                }
            }
        }

        function updateBuyerCurrentUsage() {
            if (viewModel.consumerData) {
                calculateConsumption(viewModel.consumerData);
            } else {
                consumerDataHelpers.getConsumerData(function (consumerData) {
                    calculateConsumption(consumerData);
                });
            }
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
            hasCentralHeating: ko.observable('Yes'),
            insulationType: ko.observable(),
            wallType: ko.observable(),
            propertyAge: ko.observable(),
            hasGas: ko.observable('1'),
            bestTariff: ko.observable(),
            listingStatus: ko.observable('sale'),
            buyerPostcode: ko.observable(),
            minPrice: ko.observable(),
            maxPrice: ko.observable(),
            results: ko.observable(),
            accuracy: ko.observable(0),
            lowAccuracy: ko.observable('0%'),
            mediumAccuracy: ko.observable('0%'),
            highAccuracy: ko.observable('0%'),
            regions: ko.observableArray(),
            tariffs: tariffHelpers.getTariffs(),
            resultHeaderText: ko.observable('£0<small>/month</small>'),
            resultBodyText: ko.observable('Please fill in the form to help us find the best tariff for you.'),
            showTariffDetails: ko.observable(false),
            icons: [],
            propertyTypes: ko.observableArray(),
            numberOfBedroomsOptions: ko.observableArray(),
            propertyAges: ko.observableArray(),
            insulationTypes: ko.observableArray()
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
            viewModel.hasCentralHeating('Yes');
            viewModel.insulationType(null);
            viewModel.wallType(null);
            viewModel.propertyAge(null);
            viewModel.hasGas('1');

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

        viewModel.hasCentralHeating.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.insulationType.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.bestTariff.subscribe(function (newTariff) {
            var headerText = '£' + Math.round(newTariff.total) + '<small>/month</small>',
                bodyText = 'The best tariff that we have found is ' + newTariff.name + ' at around £' + Math.round(newTariff.total) + '/month.<br>This would cost around £' + newTariff.totalGas.toFixed(2) + ' for gas, and £' + newTariff.totalElec.toFixed(2) + ' for electricity.'

            viewModel.resultHeaderText(headerText);
            viewModel.resultBodyText(bodyText);
        });

        viewModel.accuracy.subscribe(function (value) {
            if (value === 0) {
                viewModel.lowAccuracy('0%');
                viewModel.mediumAccuracy('0%');
                viewModel.highAccuracy('0%');
            } else if (value <= 40) {
                viewModel.lowAccuracy(value + '%');
                viewModel.mediumAccuracy('0%');
                viewModel.highAccuracy('0%');
            } else if (value <= 70) {
                viewModel.lowAccuracy('40%');
                viewModel.mediumAccuracy(value - 40 + '%');
                viewModel.highAccuracy('0%');
            } else if (value <= 100) {
                viewModel.lowAccuracy('40');
                viewModel.mediumAccuracy('30%');
                viewModel.highAccuracy(value - 70 + '%');
            } else {
                viewModel.lowAccuracy('40%');
                viewModel.mediumAccuracy('30%');
                viewModel.highAccuracy('30%');
            }
        });

        regionHelpers.getRegions(function (data) {
            viewModel.regions(data);
        });

        propertyHelpers.getIcons(function (icons) {
            viewModel.icons = icons;
        });

        consumerDataHelpers.getConsumerData(function (data) {
            viewModel.consumerData = data;
            data.forEach(function (consumer) {
                var type = viewModel.propertyTypes().find(function (propertyType) {
                        return propertyType === consumer.propertyType;
                    }),
                    numberBeds = viewModel.numberOfBedroomsOptions().find(function (beds) {
                        return beds === consumer.bedrooms;
                    }),
                    propertyAge = viewModel.propertyAges().find(function (age) {
                        return age === consumer.propertyBuilt;
                    }),
                    insulationType = viewModel.insulationTypes().find(function (insulation) {
                        return insulation === consumer.loftInsulation;
                    });

                if (type === undefined || type === null) {
                    var propertyTypes = viewModel.propertyTypes();
                    propertyTypes.push(consumer.propertyType);
                    propertyTypes.sort();
                    viewModel.propertyTypes(propertyTypes);
                }

                if (numberBeds === undefined || numberBeds === null) {
                    var numberOfBedroomsOptions = viewModel.numberOfBedroomsOptions();
                    numberOfBedroomsOptions.push(consumer.bedrooms);
                    numberOfBedroomsOptions.sort();
                    viewModel.numberOfBedroomsOptions(numberOfBedroomsOptions);
                }

                if (propertyAge === undefined || propertyAge === null) {
                    var propertyAges = viewModel.propertyAges();
                    propertyAges.push(consumer.propertyBuilt);
                    propertyAges.sort(function (a, b) {
                        if ((a.substr(0,3) === 'pre') !== (b.substr(0,3) === 'pre')) {
                            return a.substr(0,3) === 'pre' ? 1 : -1;
                        } else if ((a.substr(0,4) === 'post') !== (b.substr(0,4) === 'post')) {
                            return a.substr(0,4) === 'post' ? -1 : 1;
                        }
                        return a < b ? 1 : a > b ? -1 : 0;
                    });
                    viewModel.propertyAges(propertyAges);
                }

                if (insulationType === undefined || insulationType === null) {
                    var insulationTypes = viewModel.insulationTypes();
                    insulationTypes.push(consumer.loftInsulation);
                    insulationTypes.sort();
                    viewModel.insulationTypes(insulationTypes);
                }
            });
        });

        ko.applyBindings(viewModel);
    });
})();
