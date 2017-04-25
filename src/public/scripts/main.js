(function() {
    'use strict';

    require.config({
        paths: {
            jquery: '/lib/jquery/jquery.min',
            knockout: '/lib/knockout/knockout-latest',
            regionHelpers: '/scripts/regionHelpers',
            tariffHelpers: '/scripts/tariffHelpers',
            consumerDataHelpers: '/scripts/consumerDataHelpers'
        }
    });

    requirejs([
        'jquery',
        'knockout',
        'regionHelpers',
        'tariffHelpers',
        'consumerDataHelpers'
    ], function($, ko, regionHelpers, tariffHelpers, consumerDataHelpers) {

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
                    });
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
            hasCentralHeating: ko.observable(),
            hasLoftInsulation: ko.observable(),
            wallType: ko.observable(),
            propertyAge: ko.observable(),
            hasGas: ko.observable('1'),
            bestTariff: ko.observable(),
            results: ko.observable(),
            regions: ko.observableArray(),
            tariffs: tariffHelpers.getTariffs(),
            resultHeaderText: ko.observable('Please fill in the form to help us find the best tariff for you.'),
            resultBodyText: ko.observable(''),
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

        viewModel.setOwner = function () {
            viewModel.isOwner(true);
        };

        viewModel.setBuyer = function () {
            viewModel.isOwner(false);
            mapInitialized || initialize();
        };

        viewModel.setOptionDisable = function(option, item) {
            ko.applyBindingsToNode(option, {disable: item.disable}, item);
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
            var headerText = 'The best tariff that we have found is ' + newTariff.name + ' at around £' + Math.round(newTariff.total) + ' per month.',
                bodyText = 'This would cost around £' + newTariff.totalGas.toFixed(2) + ' for gas, and £' + newTariff.totalElec.toFixed(2) + ' for electricity.'

            viewModel.resultHeaderText(headerText);
            viewModel.resultBodyText(bodyText);
        });

        regionHelpers.getRegions(function (data) {
            viewModel.regions(data);
        });

        ko.applyBindings(viewModel);
    });
})();
