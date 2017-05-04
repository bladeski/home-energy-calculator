define([], function () {
    var consumerDataHelpers = {};

    consumerDataHelpers.getConsumerData = function (callback) {
        $.ajax({
            url: '/data/consumerData.json'
        }).done(function(data) {
            callback && callback(data);
        });
    };

    consumerDataHelpers.monthlyAverageConsumption = function (viewModel, consumerData, callback) {

        var result = {
                gas: 0,
                elec: 0,
                count: 0,
                accuracy: 3
            },
            count = 0,
            lowestGas = 100000,
            lowestElec = 100000,
            highestGas = 0,
            highestElec = 0,
            totalGas = 0,
            totalElec = 0,
            filtered = [],
            countThreshold = 3,
            resultFilter = function (property) {
                var matchCount = 0;

                if (viewModel.numberOfBathrooms() === property.numberofBathrooms) {
                    matchCount++;
                }
                if (viewModel.propertyAge() === property.propertyBuilt) {
                    matchCount++;
                }
                if (viewModel.hasCentralHeating() === property.centralHeating) {
                    matchCount++;
                }
                if (viewModel.hasLoftInsulation() === property.loftInsulation) {
                    matchCount++;
                }
                if (viewModel.wallType() === property.wallType) {
                    matchCount++;
                }

                return (!viewModel.propertyType() || viewModel.propertyType() === property.propertyType || viewModel.propertyType() === 'Other')
                    && (!viewModel.numberOfBedrooms() || viewModel.numberOfBedrooms() === property.bedrooms)
                    && ((viewModel.hasGas() === '0' && property.gasKwh === 0) || property.gasKwh > 0)
                    && matchCount >= countThreshold;
            },
            matchingResults = [];

        while (matchingResults.length === 0 && countThreshold >= 0) {
            matchingResults = consumerData.filter(resultFilter);
            countThreshold--;
        };

        result.accuracy = countThreshold;

        matchingResults.forEach(function (matchingResult) {
            totalGas += parseFloat(matchingResult.gasKwh);
            totalElec += parseFloat(matchingResult.electricityKwh);
            lowestGas = lowestGas < matchingResult.gasKwh ? lowestGas : matchingResult.gasKwh;
            lowestElec = lowestElec < matchingResult.electricityKwh ? lowestElec : matchingResult.electricityKwh;
            highestGas = highestGas > matchingResult.gasKwh ? highestGas : matchingResult.gasKwh;
            highestElec = highestElec > matchingResult.electricityKwh ? highestElec : matchingResult.electricityKwh;
            count++;
        });

        result.count = count;

        if (count > 4) {
            count = count - 2;
            result.gas = (totalGas - highestGas - lowestGas) / (12 * count);
            result.elec = (totalElec - highestElec - lowestElec) / (12 * count);
        } else if (count > 0) {
            result.gas = totalGas / (12 * count);
            result.elec = totalElec / (12 * count);
        } else {
            result.gas = (totalGas - highestGas - lowestGas) / 12;
            result.elec = (totalElec - highestElec - lowestElec) / 12;
        }

        callback && callback(result);
    }

    return consumerDataHelpers;
});
