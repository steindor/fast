
// var map;

// function initialize() {
//   var mapOptions = {
//     zoom: 14
//   };

//   map = new google.maps.Map(document.getElementById('single-property-map'), mapOptions);

//   // Try HTML5 geolocation
//   if(navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function(position) {
      

//       // var infowindow = new google.maps.InfoWindow({
//       //   map: map,
//       //   position: pos,
//       //   content: 'Þú ert hér!'
//       // });


//       $.post("https://maps.googleapis.com/maps/api/geocode/json?address=72+Granaskjol+107,+Reykjavik&key=AIzaSyBC2VR6hs9oYUmiFc7b14hcWSVcbKDP_m8", function(response){
    
//             var pos = new google.maps.LatLng(response.results[0].geometry.location.lat, response.results[0].geometry.location.lng);

//             // console.log(response.results[0].geometry)
//             addLocation(response.results[0].geometry.location.lat, response.results[0].geometry.location.lng, "Granaskjól")

//             map.setCenter(pos);
//       });

//     }, function() {
//       handleNoGeolocation(true);
//     });
//   } else {
//     // Browser doesn't support Geolocation
//     handleNoGeolocation(false);
//   }
// }

function addLocation(longitude, langitude, title){
    
    var myLatlng = new google.maps.LatLng(longitude, langitude);
    
    var marker = new google.maps.InfoWindow({
        position: myLatlng,
        map: map,
        content: title
    });
}

function handleNoGeolocation(errorFlag) {
  if (errorFlag) {
    var content = 'Error: The Geolocation service failed.';
  } else {
    var content = 'Error: Your browser doesn\'t support geolocation.';
  }

  var options = {
    map: map,
    position: new google.maps.LatLng(60, 105),
    content: content
  };

  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);
}

// google.maps.event.addDomListener(window, 'load', initialize);

var realEstate = realEstate || {};

realEstate.singleRealestateMap = (function($, w, undefined){



}($, window));

// realEstate.singlePropertyFinanceCalculator = (function($, w, undefined){

//     var loanAmount
//     , loanPoints
//     , typeOfLoan
//     , no_of_annuities
//     , annuity
//     , bid
//     , fasteignamat
//     , $btnCalculate = $('.btn-calculate-loan')

//     var commaToDot = function(string){
//         return string.replace(/,/g, ".")
//     }


//     var gatherInformation = function(){
//         loanAmount = $('.loan-amount').val()
//         loanPoints = commaToDot($('.loan-points').val())
//         typeOfLoan = $('input[name=type_of_loan]:checked').val()
//         no_of_annuities = $('.annuities').val()
//         fasteignamat = parseInt(($('.fasteignamat').text()).replace(/\./g, ""))
//         annuity = ($('input[name=annuity]:checked').val() === 'jafnar_greidslur' ? true : false)
//         bid = $('.bid').val();    
//     }

//     var renderHTML = function(results){
//         $('.finance-results').html(results)
//     }

//     var calculateLoan = function(){
//         gatherInformation();

//         $.post("/properties/single_property_calculation", { loanAmount: loanAmount, fasteignamat: fasteignamat, no_of_annuities: no_of_annuities, loanPoints: loanPoints, bid: bid, typeOfLoan: typeOfLoan, annuity: annuity }, function(results){
//             renderHTML(results)
//         });
//     };

//     var bindEvents = function(){
//         $btnCalculate.on("click", calculateLoan);
//     }

//     var init = function(){
//         calculateLoan();
//         bindEvents();
//     }();    

// }($, window));


realEstate.offers = (function($, w, undefined){

    $seeAllOffers = $('.see-all-offers')
    , $modal = $('#modal')
    , $modalBody = $modal.find(".modal-body")

    var showAllOffers = function(){
        var property_hash = $('.property-hash').val();

        $modal.modal("show")

        $.get("/properties/show_all_offers/"+property_hash, function(results){

            $modalBody.html(results)
        })
    }

    var bindEvents = function(){
        $seeAllOffers.on("click", showAllOffers);
    }()

}($, window))

realEstate.loadingSpinner = (function($, w, undefined){

    var spinnerHTML = "<div class='loading-spinner'><span class='glyphicon glyphicon-refresh spinning glyphicon-large'></span></div>"
    , $spinner = $('.loading-spinner');

    var hide = function(){
        $spinner.remove();
    };

    return {
        hide: hide
    };

}($, window))

realEstate.monthlyPaymentCapacity = (function($, w, undefined){

    var $calculatePaymentCapacity = $('.btn-calculate-payment-capacity')
    , $paymentCapacity = $('.payment-capacity-html')

    var renderHTML = function(html){
        setTimeout(function(){
            realEstate.loadingSpinner.hide()
            $paymentCapacity.html(html)
        }, 2500)
    };

    var fetchParameters = function(){
        var parameters = {
            adults: 2,
            children: 1,
            salary: 700000,
            mortgage_payment: 130000, 
            other_payments: 10000,
            automobile_payment: 25000,
            student_loan_payments: 20000,
            fasteignamat: 25000000, 
            cars: 1,
        };
        return parameters;
    }

    var calculatePaymentCapacity = function(){

        var loading = $('.spinner-payment-capacity').length;
        
        console.log("calc")

        if(loading > 0){
            var parameters = fetchParameters();

            $.post("/properties/calculate_monthly_payment_capacity", parameters, function(html){
                renderHTML(html)
            });

        } else {
            console.log("show spinner")
        };
    };


    var bindEvents = function(){
        $calculatePaymentCapacity.on("click", calculatePaymentCapacity);
    }();

    var init = function(){
        calculatePaymentCapacity();        
    }();

}($, window))


realEstate.newPropertyRegistration = (function($, w, undefined){

    var $fetchData = $('.fetch-property-data-btn')
    , $fetchDataForm = $('#fetch-property-data')
    , $addressForm = $('.property-address')

    var fetchData = function(){
        var address = $addressForm.val()
        
        $.post("/properties/register/fetch_property_data", { address: address }, function(response){
            $('#results-container').html(response)
        })

        return false;
    }

    var bindEvents = function(){
        $fetchDataForm.on("submit", fetchData)
    }()

}($, window))

realEstate.countdownTimer = (function($, w, undefined){

    var eventTime = new Date($('.bid-end').val()).getTime()/1000 // Timestamp - Sun, 21 Apr 2013 13:00:00 GMT
    , currentTime = new Date().getTime()/1000 // Timestamp - Sun, 21 Apr 2013 12:30:00 GMT
    , difference = eventTime - currentTime;

    if(difference >= 0){
        var clock = $('.clock').FlipClock(difference, {
            clockFace: 'DailyCounter',
            countdown: true
        })
    } else {
        $('.countdown').text('Uppboðinu er lokið!')
    }


}($, window))

$('.numerize').autoNumeric({
    aSep: ".",
    aDec: ",",
    mDec: 0
})

