define([], function () {
    var tariffHelpers = {};

    tariffHelpers.getTariffs = function (callback) {
        $.ajax({
            url: '/data/tariffs.json'
        }).done(function(data) {
            callback && callback(data);
        });

    };

    tariffHelpers.getBestTariff = function (gasKwh, elecKwh, regionCode, callback) {
        var bestTariff,
            tariffs = tariffHelpers.getTariffs(function (data) {
                regionCode = regionCode || '12';

                data.forEach(function (region) {
                    if (regionCode === region.regionCode) {
                        region.tariffs.forEach(function (tariff) {
                            var tariffElec = tariff.fuel.find(function (type) {
                                    return type.fuelType === 'E';
                                }),
                                tariffGas = tariff.fuel.find(function (type) {
                                    return type.fuelType === 'G';
                                }),
                                totalElec = (parseFloat(tariffElec.standingCharge) * 30) + (parseFloat(tariffElec.unitRate) * parseFloat(elecKwh)),
                                totalGas = (parseFloat(tariffGas.standingCharge) * 30) + (parseFloat(tariffGas.unitRate) * parseFloat(gasKwh)),
                                total = totalGas + totalElec;

                            if (!bestTariff || total < bestTariff.total) {
                                bestTariff = tariff;
                                bestTariff.total = total;
                                bestTariff.totalGas = totalGas;
                                bestTariff.totalElec = totalElec;
                            }
                        });
                    }
                });
                callback && callback(bestTariff);
            });
    };

    return tariffHelpers;
});
