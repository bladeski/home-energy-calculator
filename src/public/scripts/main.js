(function() {
    'use strict';

    require.config({
        paths: {
            jquery: '/lib/jquery/jquery.min',
            knockout: '/lib/knockout/knockout-latest',
            tariffHelpers: '/scripts/tariffHelpers'
        }
    });

    requirejs([
        'jquery',
        'knockout',
        'tariffHelpers'
    ], function($, ko, tariffHelpers) {

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
            tariffHelpers.getBestTariff(
                viewModel.currentGasUsage(),
                viewModel.currentElecUsage(),
                viewModel.regionCode(),
                function (tariff) {
                    viewModel.bestTariff(tariff);
            });
        }

        var viewModel = {
            isOwner: ko.observable(true),
            currentGasUsage: ko.observable(0),
            currentElecUsage: ko.observable(0),
            tariffs: tariffHelpers.getTariffs(),
            bestTariff: ko.observable(),
            resultHeaderText: ko.observable('Please fill in the form to help us find the best tariff for you.'),
            resultBodyText: ko.observable(''),
            regionCode: ko.observable()
        };

        viewModel.setOwner = function () {
            viewModel.isOwner(true);
        };

        viewModel.setBuyer = function () {
            viewModel.isOwner(false);
            mapInitialized || initialize();
        };

        viewModel.currentGasUsage.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.currentElecUsage.subscribe(function () {
            updateCurrentUsage();
        });

        viewModel.bestTariff.subscribe(function (newTariff) {
            var headerText = 'The best tariff that we have found is ' + newTariff.name + ' at around £' + Math.round(newTariff.total) + ' per month.',
                bodyText = 'This would cost around £' + newTariff.totalGas.toFixed(2) + ' for gas, and £' + newTariff.totalElec.toFixed(2) + ' for electricity.'

            viewModel.resultHeaderText(headerText);
            viewModel.resultBodyText(bodyText);
        });

        ko.applyBindings(viewModel);
    });
})();
