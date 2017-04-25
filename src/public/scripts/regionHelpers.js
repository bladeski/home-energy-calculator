define(['knockout', 'tariffHelpers'], function (ko, tariffHelpers) {
    var regionHelpers = {};

    regionHelpers.getAreas = function (callback) {
        var tariffs = [];

        $.ajax({
            url: '/data/areaList.json'
        }).done(function(data) {
            callback && callback(data);
        });

    };

    regionHelpers.getRegions = function (callback) {
        var allRegions = [];

        regionHelpers.getAreas(function (areas) {
            tariffHelpers.getTariffs(function(data) {

                data.forEach(function (tariff) {
                    allRegions.push({
                        regionCode: tariff.regionCode,
                        regionName: tariff.regionName,
                        disable: ko.observable(true)
                    });

                    areas.forEach(function (area) {
                        if (area.Code === tariff.regionCode) {
                            allRegions.push({
                                regionCode: area.Code,
                                regionName: ' - ' + area.Name,
                                disable: ko.observable(false)
                            });
                        }
                    });

                });

                callback && callback(allRegions);
            });
        });
    }

    return regionHelpers;
});
