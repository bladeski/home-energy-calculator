/**
 * @author jonathan.blades
 */
			
var apiKey = 'fvxgcw7pvdumvy8d65tk3kns';
var zooplaQueryUrl = 'http://api.zoopla.co.uk/api/v1/property_listings.js?api_key=' + apiKey;
var listingStatus = null;
var zooplaData = [];	
var postcode;
var infoWindow;
var markersArray = [];

/* Function that loads an XML data file - courtesy of W3Schools */
function loadXMLDoc(dname){
	if (window.XMLHttpRequest){
		xhttp = new XMLHttpRequest();
	}
	else{
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.open("GET",dname,false);
	xhttp.send();
	return xhttp.responseXML;
}

/* Function to populate the dropdown box, allowing users to select a region for their property. */
function populateDropDown(){
	var regionCode;
	var regionListFile = loadXMLDoc("./xmldata/regionList.xml");
	var regionList = regionListFile.getElementsByTagName('Region');
	
	for(var i = 0; i < regionList.length; i++){
		$("#regionList").append($("<option />").val(regionList[i].getAttribute("Name")).text(regionList[i].getAttribute("Name")));
	}
}

/* Function to add a "marker" to the Google Map. */
function markerListener(marker, infoWindow)
{
    // so marker is associated with the closure created for the listenMarker function call
    google.maps.event.addListener(marker, 'click', function() {
		infoWindow.open(map, marker);
	});
}

/* Function to clear current overlays from Google map */
function deleteOverlays() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
		}
		markersArray.length = 0;
	}
}

/* Function to create markers to be placed on the map, according to the Zoopla query results */ 	
function postcodeQueryZoopla(data) {
	deleteOverlays();
	zooplaData = data;
	var latitude;
	var longitude;
	var latLong;
	var marker;
	var contentstring;
	
	if(zooplaData.listing.length > 0){
		/* Takes the latitude and longitude of the property and creates a Google marker using this information */ 
		for(var i=0; i<zooplaData.listing.length; i++){
			latitude = zooplaData.listing[i].latitude;
			longitude = zooplaData.listing[i].longitude;
			latLong = new google.maps.LatLng(latitude,longitude);
			marker = new google.maps.Marker({
				position: latLong,
				map: map,
				title: zooplaData.listing[i].displayable_address
			});	
			markersArray.push(marker);
			
			/* Adds property details to the marker's infoWindow and calls the markerListener function to place this on the map */
			contentString = '<div class="infoWindow">'+
				'<p><strong>' + zooplaData.listing[i].displayable_address + '</strong></p>'+
				'<p>' + zooplaData.listing[i].short_description + '</p>'+
				'<p><a href="' + zooplaData.listing[i].details_url + '" target=_blank">more details on the Zoopla website...</a></p>'+
				'<p><a href="#" onclick="selectProperty(' + i + ')">select property for your energy calculation...</a></p>'+
				'</div>';
			var infoWindow = new google.maps.InfoWindow({
				content: contentString
			});
	
			markerListener(marker, infoWindow);
		}
		/* Centers the map on the last marker, rather than leaving it centered on the previous location */
		map.setCenter(latLong);
	}
	
	else{
		window.alert("Sorry, there are no results available. Please refine your search criteria and try again.")
	}
}

/* Function to submit the form requesting Zoopla properties */
function submitForm(){
	var error=0;
	var minPrice;
	var maxPrice;
	
	form=$("#buyer-form").serializeArray();
	$.each(form, function(i, field){
		if(field.name == 'listing-status' && (field.value == 'sale' || field.value == 'rent')){
			listingStatus = field.value;
			error = error + 1; 
		}
		if(field.name == 'postcode' && field.value != ''){
		    postcode = field.value;
			error = error + 10;
		}
		if(field.name == 'min-price'){ 
			minPrice = field.value;
		}
		if(field.name == 'max-price'){
			maxPrice = field.value;
		}
	})
	
	if(listingStatus == 'sale'){
		minPrice = minPrice;
		maxPrice = maxPrice;
	}
	
	if(maxPrice - minPrice > 0){
		error = error + 100;
	}
	else{
		window.alert("Please ensure that your maximum price is greater than your minimum price.");
	}
	
	if(error == 111){
	    $.ajax({
			url: zooplaQueryUrl + '&postcode=' + postcode + '&radius=1&page_size=20&listing_status=' + listingStatus + '&minimum_price=' + minPrice + '&maximum_price=' + maxPrice,
			dataType: "jsonp",
			success: function(data) {
				console.log("zoopla call : success");
				postcodeQueryZoopla(data);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.log('zoopla call : error ', jqXHR, textStatus, errorThrown);
			},
			jsonp: 'jsonp'
		});
	}
	else if(error == 0){
		window.alert("Please complete the form to continue.");
	}
	else if(error == 1){
		window.alert("Please enter a postcode for the area you are searching, and a price range for your property.");
	}
	else if(error == 10){
		window.alert("Please tell us if you are buying or renting, and enter a price range for your property.");
	}
	else if(error == 11){
		window.alert("Please enter a price range for your property.");
	}
	else if(error == 100){
		window.alert("Please tell us if you are buying or renting, and enter the postcode for the area you are searching.");
	}
	else if(error == 101){
		window.alert("Please enter a postcode for the area you are searching.");
	}
	else if(error == 110){
		window.alert("Please tell us if you are buying or renting.");
	}
};

/* Function that selects a Zoopla property and gathers the information about it, in order to calculate the energy usage estimate */
function selectProperty(i){
	var propertyType = zooplaData.listing[i].property_type;
	var bedrooms = zooplaData.listing[i].num_bedrooms;
	var numberofBathrooms = zooplaData.listing[i].num_bathrooms;
	var new_home = zooplaData.listing[i].new_home;
	var region = zooplaData.listing[i].county;
	var age;
	var hasGas = true;
		
	if(propertyType != 'Flat' && propertyType != 'Terrace' && propertyType != 'Detached' && propertyType != 'Semi-detached' && propertyType != 'Bungalow'){
		propertyType = null;
	}
	
	if(bedrooms == 1 || bedrooms == 2){
		bedrooms = '1 to 2'; 
	}
	
	else if(bedrooms == 3){
		bedrooms = '3';
	}
	
	else if(bedrooms >= 4){
		bedrooms = '4 +';
	}
	
	if(numberofBathrooms == 0){
		numberofBathrooms = null;
	}
	
	if(new_home == true){
		age = 'post 1980';
	}
	
	else{
		age = null;
	}
	
	var gasAvg = monthlyAverageConsumption('gas', hasGas, propertyType, bedrooms, numberofBathrooms, age);
	var elecAvg = monthlyAverageConsumption('electricity', hasGas, propertyType, bedrooms, numberofBathrooms, age);
	/* Retry the call for average data, being less specific for matches, should the reuquest be too specific to generate any results. */
	if(gasAvg == 0 && elecAvg == 0){
		var gasAvg = monthlyAverageConsumption('gas', hasGas, propertyType, bedrooms, null, null);
		var elecAvg = monthlyAverageConsumption('electricity', hasGas, propertyType, bedrooms, null, null);
	}
	
	bestDeal(gasAvg, elecAvg, region);
	
	$("#top").animate({left:"0"},"slow");
	$("#middle").animate({left:"0"},"slow");
	$("#bottom").animate({left:"0"},"slow");
}

/* Function to calculate the average energy consumption of a property, based on criteria provided by the user and using averages from the npower data sets */
function monthlyAverageConsumption(fuelType, hasGas, propertyType, bedrooms, numberofBathrooms, age, centralHeating, loftInsulation, wallType){
	
	var highestVal = 0;
	var lowestVal = 10000;
	var total = 0;
	var count = 0;
	var average;
	var fuelKwh = fuelType + 'Kwh';
	
	var consumerDataFile = loadXMLDoc("./xmldata/consumerData.xml");
	var consumerData = consumerDataFile.getElementsByTagName('consumptionData');
	
	if(fuelType == 'gas' && hasGas == false){
		return 0;
	}
	
	else if(fuelType == 'electricity' && hasGas == false){
				
		for(var i = 0; i < consumerData.length; i++){
			
			if(propertyType == null | propertyType == '' | propertyType == consumerData[i].getAttribute("propertyType")){
				if(bedrooms == null | bedrooms == '' | bedrooms == consumerData[i].getAttribute("bedrooms")){
					if(numberofBathrooms == null | numberofBathrooms == '' | numberofBathrooms == consumerData[i].getAttribute("numberofBathrooms")){
						if(age == null | age == '' | age == consumerData[i].getAttribute("propertyBuilt")){
							if(centralHeating == null | centralHeating == '' |  centralHeating == consumerData[i].getAttribute("centralHeating")){
								if(loftInsulation == null | loftInsulation == consumerData[i].getAttribute("loftInsulation")){
									if(wallType == null | wallType == consumerData[i].getAttribute("wallType")){
										var fuelUsage = parseInt(consumerData[i].getAttribute(fuelKwh));
										
										if(parseInt(consumerData[i].getAttribute("gasKwh")) == 0){
											if(fuelUsage < lowestVal){
												lowestVal = fuelUsage;
											}
											if(fuelUsage > highestVal){
												highestVal = fuelUsage;
											}
											total = total + fuelUsage;
											count++;
										}
									}
								}
							}
						}
					}
				}
			} 
		}
			
		if(count > 4){
			total = total - highestVal - lowestVal;
			count = count - 2;
		}
		if(count == 0){
			count = 1;
		}
		total = total/12;
		average = total/count;
				
		
		var divID = fuelType + "Result";
		return average;
	}
	
	else {		
		for(var i = 0; i < consumerData.length; i++){
			if(propertyType == null || propertyType == '' || propertyType == consumerData[i].getAttribute("propertyType")){
				if(bedrooms == null || bedrooms == '' || bedrooms == consumerData[i].getAttribute("bedrooms")){
					if(numberofBathrooms == null || numberofBathrooms == '' || numberofBathrooms == consumerData[i].getAttribute("numberofBathrooms")){
						if(age == null || age == '' || age == consumerData[i].getAttribute("propertyBuilt")){
							if(centralHeating == null || centralHeating == '' ||  centralHeating == consumerData[i].getAttribute("centralHeating")){
								if(loftInsulation == null || loftInsulation == consumerData[i].getAttribute("loftInsulation")){
									if(wallType == null || wallType == consumerData[i].getAttribute("wallType")){
										var fuelUsage = parseInt(consumerData[i].getAttribute(fuelKwh));
										
										if(fuelUsage > 0){
											if(fuelUsage < lowestVal){
												lowestVal = fuelUsage;
											}
											if(fuelUsage > highestVal){
												highestVal = fuelUsage;
											}
											total = total + fuelUsage;
											count++;
										}
									}
								}
							}
						}
					}
				}
			} 
		}
			
		if(count > 4){
			total = total - highestVal - lowestVal;
			count = count - 2;
		}
		if(count == 0){
			count = 1;
		}
		total = total/12;
		average = total/count;
		
		var divID = fuelType + "Result";
		return average;
	}
}

/* Function to pass either the average energy usage for the property and calculate which tariff would be best suited to the user based on their location */  
function bestDeal(gasKwh, electricityKwh, region){
	var regionCode;
	var regionListFile = loadXMLDoc("./xmldata/regionList.xml");
	var regionList = regionListFile.getElementsByTagName('Region');
	var regionTariffFile =  loadXMLDoc("./xmldata/regionTariffs.xml");
	var regionTariff = regionTariffFile.getElementsByTagName('region');
	var bestGas;
	var bestElec;
	var bestDeal = ['0','100000'];
	var currentGas;
	var currentElec;
	var currentDeal;
	
	for(var i = 0; i < regionList.length; i++){
		if(region == regionList[i].getAttribute("Name")){
			regionCode = regionList[i].getAttribute("Code");	
		}
	}
	
	if(regionCode == null){
		regionCode = '12'; 
	}
	
	for(var i = 0; i < regionTariff.length; i++){
		if(regionCode == regionTariff[i].getAttribute("regionCode")){
			var currentRegionTariff = regionTariff[i].getElementsByTagName("tariff");
			for(var j = 0; j < currentRegionTariff.length; j++){
				currentElec = ((currentRegionTariff[j].getElementsByTagName("fuel")[0].getAttribute("standingCharge") * 30) + (currentRegionTariff[j].getElementsByTagName("fuel")[0].getAttribute("unitRate") * electricityKwh));
				currentGas = ((currentRegionTariff[j].getElementsByTagName("fuel")[1].getAttribute("standingCharge") * 30) + (currentRegionTariff[j].getElementsByTagName("fuel")[1].getAttribute("unitRate") * gasKwh)); 
				currentDeal = currentElec + currentGas;

				if(currentDeal < bestDeal[1]){
					bestDeal[0] = j;
					bestDeal[1] = currentDeal.toFixed(2);
					bestGas = currentGas;
					bestElec = currentElec;
				}
			}
		}
	}
	$(".result").html(bestDeal[1]);
	$(".tariff").html(bestDeal[0] + 1);
	$(".gas-result").html(bestGas.toFixed(2));
	$(".elec-result").html(bestElec.toFixed(2));
}

/* Function to deal with the first part of the 'owner' form, either passing the details directly to calculation, or bringing in part 2 of the form. */
function submitOwnerForm1(){
	var gasUsage;
	var elecUsage;
	var region;
	
	form=$("#owner-form").serializeArray();
	$.each(form, function(i, field){
		if(field.name == 'gas-usage'){
			gasUsage = field.value;
		}
		else if(field.name == 'elec-usage'){
			elecUsage = field.value;
		}
		else if(field.name == 'region'){
			region = field.value;
		}
	});
	
	if(gasUsage == '' || elecUsage ==''){
		$("#owner-form2").fadeIn();
	}
	else if(gasUsage == '0' && elecUsage == '0'){
		$("#owner-form2").fadeIn();
	}
	else{
		/* Calculate the best deal if gas and electricity usage details are provided by the user */
		bestDeal(gasUsage, elecUsage, region);
		$("#top").animate({left:"-400%"},"slow");
		$("#middle").animate({left:"-400%"},"slow");
		$("#bottom").animate({left:"-400%"},"slow");
	}
}

/* Function to submit and process the second part of the owner form, performing a monthly average calculation based on the details input and teh npower data set. */
function submitOwnerForm2(){
	var propertyType;
	var bedrooms;
	var age;
	var region;
	var gasAvg;
	var elecAvg;
	var hasGas = false;
	
	form1=$("#owner-form").serializeArray();
	form2=$("#owner-form2").serializeArray();
	
	$.each(form1, function(i, field){
		if(field.name == 'region'){
			region = field.value;
		}
	});
	
	$.each(form2, function(i, field){
		if(field.name == 'propertyType'){
			propertyType= field.value;
		}
		else if(field.name == 'bedrooms'){
			bedrooms = field.value;
		}
		else if(field.name == 'age'){
			age = field.value;
		}
		else if(field.name == 'hasGas'){
			hasGas = true;
		}
	});

	gasAvg = monthlyAverageConsumption('gas', hasGas, propertyType, bedrooms, null, age);
	elecAvg = monthlyAverageConsumption('electricity', hasGas, propertyType, bedrooms, null, age);
	
	
	if(gasAvg == 0 && elecAvg == 0){
		var gasAvg = monthlyAverageConsumption('gas', hasGas, propertyType, bedrooms);
		var elecAvg = monthlyAverageConsumption('electricity', hasGas, propertyType, bedrooms);
	
		if(gasAvg == 0 && elecAvg == 0){
			var gasAvg = monthlyAverageConsumption('gas', hasGas, propertyType);
			var elecAvg = monthlyAverageConsumption('electricity', hasGas, propertyType);
		}
	}
	
	bestDeal(gasAvg, elecAvg, region);
	$("#top").animate({left:"-400%"},"slow");
	$("#middle").animate({left:"-400%"},"slow");
	$("#bottom").animate({left:"-400%"},"slow");
	
}
