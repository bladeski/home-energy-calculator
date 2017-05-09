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
                accuracy: 0
            },
            count = 0,
            lowestGas = 100000,
            lowestElec = 100000,
            highestGas = 0,
            highestElec = 0,
            totalGas = 0,
            totalElec = 0,
            filtered = [],
            countThreshold = 6,
            runningAccuracy = 0,
            resultFilter = function (property) {
                var matchCount = 0,
                    accuracy = 0;

                if (viewModel.propertyAge() === property.propertyBuilt) {
                    accuracy += 10;
                    matchCount++;
                }
                if (viewModel.hasCentralHeating() === property.centralHeating) {
                    accuracy += 10;
                    matchCount++;
                }
                if (viewModel.insulationType() === property.loftInsulation) {
                    accuracy += 10;
                    matchCount++;
                }
                if (viewModel.numberOfBathrooms() === property.numberofBathrooms) {
                    accuracy += 5;
                    matchCount++;
                }
                // if (viewModel.wallType() === property.wallType) {
                //     matchCount++;
                // }

                if (viewModel.propertyType() === property.propertyType) {
                    accuracy += 15;
                    matchCount++;
                }

                if (viewModel.numberOfBedrooms() === property.bedrooms) {
                    accuracy += 20;
                    matchCount++;
                }

                // result.accuracy = accuracy > result.accuracy ? accuracy : result.accuracy;
                if (matchCount >= countThreshold) {
                    runningAccuracy += accuracy;
                }

                return matchCount >= countThreshold && ((viewModel.hasGas() === '0' && parseInt(property.gasKwh) === 0) || (viewModel.hasGas() === '1' && parseInt(property.gasKwh) > 0));
            },
            matchingResults = [];

        while (matchingResults.length === 0 && countThreshold >= 0) {
            accuracy = 0;
            matchingResults = consumerData.filter(resultFilter);
            countThreshold--;
        };

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
        result.accuracy = runningAccuracy / count;

        if (count > 4) {
            count = count - 2;
            result.gas = (totalGas - highestGas - lowestGas) / (12 * count);
            result.elec = (totalElec - highestElec - lowestElec) / (12 * count);
            result.accuracy += 20;
        } else if (count > 0) {
            result.gas = totalGas / (12 * count);
            result.elec = totalElec / (12 * count);
            result.accuracy += count * 4;
        } else {
            result.gas = (totalGas - highestGas - lowestGas) / 12;
            result.elec = (totalElec - highestElec - lowestElec) / 12;
            result.accuracy = 0;
        }

        callback && callback(result);
    }

    return consumerDataHelpers;
});
