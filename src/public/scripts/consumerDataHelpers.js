define([], function () {
    var consumerDataHelpers = {};

    consumerDataHelpers.getConsumerData = function (callback) {
        var consumerData = [];

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
                count: 0
            },
            count = 0,
            lowestGas = 100000,
            lowestElec = 100000,
            highestGas = 0,
            highestElec = 0,
            totalGas = 0,
            totalElec = 0,
            filtered = [],
            matchingResults = consumerData.filter(function (property) {
                return (!viewModel.propertyType() || viewModel.propertyType() === property.propertyType)
                    && (!viewModel.numberOfBedrooms() || viewModel.numberOfBedrooms() === property.bedrooms)
                    && (!viewModel.numberOfBathrooms() || viewModel.numberofBathrooms() === property.numberofBathrooms)
                    && (!viewModel.propertyAge() || viewModel.propertyAge() === property.propertyBuilt)
                    && (!viewModel.hasCentralHeating() || viewModel.hasCentralHeating() === property.centralHeating)
                    && (!viewModel.hasLoftInsulation() || viewModel.hasLoftInsulation() === property.loftInsulation)
                    && (!viewModel.wallType() || viewModel.wallType() === property.wallType)
                    && ((viewModel.hasGas() === '0' && property.gasKwh === 0) || property.gasKwh > 0);
            });

        if (matchingResults.length === 0) {
            matchingResults = consumerData.filter(function (property) {
                return (!viewModel.propertyType() || viewModel.propertyType() === property.propertyType)
                    && (!viewModel.numberOfBedrooms() || viewModel.numberOfBedrooms() === property.bedrooms)
                    && (!viewModel.numberOfBathrooms() || viewModel.numberofBathrooms() === property.numberofBathrooms)
                    && (!viewModel.propertyAge() || viewModel.propertyAge() === property.propertyBuilt)
                    && ((viewModel.hasGas() === '0' && property.gasKwh === 0) || property.gasKwh > 0);
            });
            filtered.push('1');
        }

        if (matchingResults.length === 0) {
            matchingResults = consumerData.filter(function (property) {
                return (!viewModel.propertyType() || viewModel.propertyType() === property.propertyType)
                    && (!viewModel.numberOfBedrooms() || viewModel.numberOfBedrooms() === property.bedrooms)
                    && (!viewModel.numberOfBathrooms() || viewModel.numberofBathrooms() === property.numberofBathrooms)
                    && ((viewModel.hasGas() === '0' && property.gasKwh === 0) || property.gasKwh > 0);
            });
            filtered.push('2');
        }

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
