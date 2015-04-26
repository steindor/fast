
var utils = utils || {};

/**
 * Prototype functions
 */

Number.prototype.formatMoney = function(c, d, t){
    var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "," : d, 
    t = t == undefined ? "." : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

/**
 * Utility functions - move to seperate folder
 */

utils.calculateMonthlyPayment = function(mortgage_value, interest_rate, no_of_payments){
    return ((((mortgage_value)*((Math.pow((1+(((interest_rate)/12)/100)), (no_of_payments))) * (((interest_rate)/100)))) / (((Math.pow((1+(((interest_rate)/12)/100)), (no_of_payments))) - 1))/12))
}

utils.calculateMonthlyRealestateTax = function(fasteignamat){
    return 0.005*fasteignamat/12;
}

utils.calculateLoan = function(value_of_bid, loanAmount, points, no_of_annuities, loanType){
    var interests = (loanAmount*(points/100))/12
    , capitalPayment = loanAmount/(no_of_annuities*12)
    , LTV = (100*loanAmount/value_of_bid).toFixed(0)

    if(loanType === "verdtryggt"){
        var payment = utils.calculateMonthlyPayment(loanAmount, points, no_of_annuities*12);
    } else {
        
    }


    return {
        downPayment: value_of_bid - loanAmount,
        firstPayment: payment,
        LTV: LTV
    }
}

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mysql = require('mysql')
  , cheerio = require('cheerio')
  , request = require('request')
  , moment = require('moment')
  , querystring = require('querystring')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'gunnitheman85',
    database : 'fasteignagreinir',
    multipleStatements: true
});

connection.connect();

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 7000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(require('stylus').middleware(__dirname + '/public'));
    app.use(express.static(path.join(__dirname, 'public')));
});

app.locals({
    moment: function(date){
        return moment(date)
    }
})

moment.locale('is')

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', function(req, res){

    connection.query('SELECT * FROM properties_for_sale LEFT JOIN properties_for_sale_details ON properties_for_sale.property_hash = properties_for_sale_details.property_hash LEFT JOIN properties_for_sale_images ON properties_for_sale.property_hash = properties_for_sale_images.property_hash LEFT JOIN properties_for_sale_location_info ON properties_for_sale.property_hash = properties_for_sale_location_info.property_hash LEFT JOIN properties_for_sale_value_numbers ON properties_for_sale.property_hash = properties_for_sale_value_numbers.property_hash LEFT JOIN properties_for_sale_bid_info ON properties_for_sale.property_hash = properties_for_sale_bid_info.property_hash', function(err, rows, fields) {
        if (err) throw err;

        console.log(rows)

        res.render('index', { 
            properties: rows
        });
    });
});

app.get("/properties/:property_hash", function(req, res){

    connection.query('SELECT *, MAX(offer_value) AS max_offer, (CAST(patients AS decimal)/ CAST(doctors AS decimal)*100)/100 AS patient_per_doctor, IF(MAX(offer_value) < starting_bid, FALSE, TRUE) AS reserve_met FROM properties_for_sale LEFT JOIN properties_for_sale_details ON properties_for_sale.property_hash = properties_for_sale_details.property_hash LEFT JOIN properties_for_sale_description ON properties_for_sale.property_hash = properties_for_sale_description.property_hash LEFT JOIN offers ON properties_for_sale.property_hash = offers.property_hash LEFT JOIN properties_for_sale_images ON properties_for_sale.property_hash = properties_for_sale_images.property_hash LEFT JOIN properties_for_sale_location_info ON properties_for_sale.property_hash = properties_for_sale_location_info.property_hash LEFT JOIN properties_for_sale_value_numbers ON properties_for_sale.property_hash = properties_for_sale_value_numbers.property_hash LEFT JOIN clinics ON clinics.postnumer LIKE CONCAT("%", properties_for_sale_location_info.postal_number, "%") LEFT JOIN properties_for_sale_bid_info ON properties_for_sale.property_hash = properties_for_sale_bid_info.property_hash WHERE properties_for_sale.property_hash = ?', req.params.property_hash, function(err, rows, fields) {
        if (err) throw err;

        res.render('single_property', { 
            property: rows[0]
        });
    });
});

app.get('/properties/show_all_offers/:property_hash', function(req, res){
    
    connection.query("SELECT * FROM offers WHERE property_hash = ?", req.params.property_hash, function(err, rows, fields){
        if(err) throw err;
        else {

            res.render("subviews/all_offers_table", { offers: rows })
        };
    });
});

app.get('/properties/register/register_new', function(req, res){
    
    res.render("register_new_property");
});

app.get('/properties/register_details/:property_data', function(req, res){
    
    var propertyData = JSON.parse(req.params.property_data);

    res.render("register_property_details", { property: propertyData })
});

app.post('/properties/register/fetch_property_data', function(req, res){

    // console.log()

    var url = "http://www.skra.is/default.aspx?pageid=e4db60a3-50f1-4e6d-88f0-37ad9dfb371f&selector=streetname&streetname="+querystring.escape(req.body.address)+"&submitbutton=Leita";

    request(url, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request
        if (error) throw error
        else {
            // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality

            var $ = cheerio.load(html);

            var tableData = {}
            , fastaNr = [];

            $('.resulttable.large').find('tbody tr').each(function(i){

                $this = $(this);

                tableData[i] = [];

                $this.find("td").each(function(){
                    var html = $(this).text();
                    if(html.length < 20){
                        tableData[i].push($(this).text());
                    }
                });
            });

            var data = {};

            console.log(tableData)

            for(var key in tableData){

                /*
                    fjarlaegja duplicates, bilskurar og aukabyggingar fa sama fastanumer
                 */ 

                if(fastaNr.indexOf(tableData[key][0]) === -1){

                    data[key] = {
                        fastanr: tableData[key][0],
                        numer: tableData[key][1],
                        bygg_ar: tableData[key][2],
                        birt_staerd: tableData[key][3],
                        fasteignamat: tableData[key][4],
                        brunabotamat: tableData[key][6],
                        lodarmat: tableData[key][5],
                        address: req.body.address
                    }
                    
                    fastaNr.push(tableData[key][0])
                }

            }

            console.log(data)

            res.render("subviews/choose_property", {
                properties: data
            })
        }
    })


});

app.post("/properties/calculate_monthly_payment_capacity", function(req, res){

    // var paymentCapacity = utils.calculateMonthlyPaymentCapacity(req.body)

    res.render("subviews/payment_capacity")
});


app.post("/properties/single_property_calculation", function(req, res){

    console.log(req.body)
    var financeDetails = utils.calculateLoan(parseFloat(req.body.bid.replace(/\./g,"")), parseFloat(req.body.loanAmount.replace(/\./g,"")), req.body.loanPoints, req.body.no_of_annuities, req.body.typeOfLoan)
    
    financeDetails.real_estate_tax = utils.calculateMonthlyRealestateTax(req.body.fasteignamat)
    financeDetails.fraveitugjold = 12234;
    financeDetails.heating = 18534
    financeDetails.electricity = 13230
    financeDetails.insurance = 1520
    financeDetails.total_cost = 243983

    res.render("subviews/single_property_calculation", financeDetails)

}); 

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
