// server.js

// FUNCTIONS
// =============================================================================
/*
var updateAuthToken = function() {
    //Retrieving auth key
    var parsed;
    request.post({
        uri: "https://api.sandbox.paypal.com/v1/oauth2/token",
        headers: {
            "Accept": "application/json",
            "Accept-Language": "en_US",
            "content-type": "application/x-www-form-urlencoded"
        },
        auth: {
        'user': 'AbVpTSAYTI7SIW7Gwj0O5jl1ZTpV8otjaLjJVBsgTb4zzkoulzw0Ibu_w9ws341pd0beCnpMjVV4tfNH',
        'pass': 'EDwr5Y4DhIitIunMA81Nop13k0N8jDNqymMuTdtyadO4TRGqdDJVefhqjuIlkZUJEiV2vgbjl0uakLGb',
        // 'sendImmediately': false
        },
        form: {
            "grant_type": "client_credentials"
        }
    }, function(error, response, body) {
        console.log(body);
        parsed = JSON.parse(body);
        console.log(parsed.access_token);
        console.log(parsed.expires_in);
        var d = new Date();
        persistent.putSync('lastAuthCheck', d.getTime()); //Update time last-checked
        persistent.putSync('PayPalAuthExpiration', (d.getTime() + parsed.expires_in * 1000)); //Update expiration time
        persistent.putSync('PayPalAuthToken', parsed.access_token); //Save auth token
    });

    //End of Auth Token


}
*/


// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');            // call express
var app        = express();                     // define our app using express
var bodyParser = require('body-parser');
var request    = require('request');            //Required for outgoing HTTP
var schedule   = require('node-schedule');      //Required for Node Task Scheduling
var cache      = require('persistent-cache');   //Required for caching persistent values
var braintree  = require('braintree')



// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 1337;        // set our port

//SERVER START ITEMS
// =============================================================================

//Set up caching of persistent vals
var persistent = cache();

//PayPal braintree
var gateway    = braintree.connect({  
    accessToken: 'access_token$sandbox$q987w6gt6d75b5bq$ad326f23f2af0d642cd5a9420dd65430'
});


//Check Auth Token is valid for at least an hour
/*
var d = new Date();
persistent.putSync('lastAuthCheck', d.getTime()); //Update time last-checked
var authTokenExp;
persistent.get('PayPalAuthExpiration', function(err, authExp) {
    if (err)
        throw err;
    authTokenExp = authExp; 
});
if (authTokenExp != undefined) { //Check to see how long it's value for
    expDate = new Date(authTokenExp)
    if ((authTokenExp - d) * 1000 * 60 * 60 < 1) { //Less than an hour remaining 
        updateAuthToken(); //Update the token
    }
}
else {
    updateAuthToken(); //If there's no value???? update anyways
}
*/



//Set Up Schedule to Update Auth Token
/*
var rule = new schedule.RecurrenceRule();
rule.minute = 30; //Update on every half-hour
var j = schedule.scheduleJob(rule, function(){
    persistent.putSync('lastAuthCheck', d.getTime()); //Update time last-checked
    var authTokenExp;
    persistent.get('PayPalAuthExpiration', function(err, value) { //Get expiration time
        authTokenExp = value;
    });
    if (authTokenExp != undefined) { //Check to see how long it's value for
        expDate = new Date(authTokenExp)
        if ((authTokenExp - d) * 1000 * 60 * 60 < 1) { //Less than an hour remaining 
            updateAuthToken(); //Update the token
        }
    }
    else {
        updateAuthToken(); //If there's no value???? update anyways
    }
});
*/


// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests


router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// serve files in static' folder at root URL '/'
app.use('/', express.static('static'));


// test route to make sure everything is working (accessed at GET http://localhost:4343/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here

router.get("/client_token", function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
      res.send(response.clientToken);
    });
  });

router.post("/checkout", function (req, res) {
    var nonce = req.body.nonce;
    console.log(nonce);
    // Use payment method nonce here
    var saleRequest = {
        amount: req.body.amount,
        merchantAccountId: "CAD",
        paymentMethodNonce: req.body.nonce,
        orderId: "Mapped to PayPal Invoice Number",
        descriptor: {
          name: "SMARTMLONDON*METER0001"
        },
        options: {
          paypal: {
            customField: "PayPal custom field",
            description: "Description for PayPal email receipt"
          },
          submitForSettlement: true
        }
      };
      
      gateway.transaction.sale(saleRequest, function (err, result) {
        if (err) {
          res.send("<h1>Error:  " + err + "</h1>");
        } else if (result.success) {
          res.send("<h1>Success! Transaction ID: " + result.transaction.id + "</h1>");
        } else {
          res.send("<h1>Error:  " + result.message + "</h1>");
        }
      });
  });

//Paypal
/*

//could go in form if desired: "experience_profile_id":"experience_profile_id",
router.route('/paypal/create') //default amount of $3
    .post(function(req, res) {
        request.post({
            uri: "https://api.sandbox.paypal.com/v1/payments/payment",
            headers: {
                "content-type": "application/json",
                "Authorization": ( "Bearer " + persistent.get('PayPalAuthToken'))
            }, 
            form: {
                "intent": "sale",
                "redirect_urls":
                {
                    "return_url": "https://example.com",
                    "cancel_url": "https://example.com"
                },
                "payer":
                {
                    "payment_method": "paypal"
                },
                "transactions": [
                {
                    "amount":
                    {
                    "total": "3.00",
                    "currency": "CAD",
                    "details":
                    {
                        "subtotal": "3.00"
                    }
                    },
                    "description": "The payment transaction description.",
                    "invoice_number": "merchant invoice",
                    "custom": "merchant custom data"
                }]
            }
        }, function(error, response, body) {
            console.log(body);
        });
    });

*/


// on routes that end in /meters
// ----------------------------------------------------
router.route('/meters')

    // create a meter (accessed at POST http://localhost:4343/api/meters)
    .post(function(req, res) {

        var meter = new Meter();      // create a new instance of the Meter model
        meter.name = req.body.name;  // set the meters name (comes from the request)
        meter.gps_long = req.body.gps_long;
        meter.gps_lat = req.body.gps_lat;
        meter.rate = req.body.rate;
        meter.start_time = req.body.start_time;
        meter.end_time = req.body.end_time;

        // save the meter and check for errors
        meter.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Meter created!' });
        });

    })

    // get all the meters (accessed at GET http://localhost:4343/api/meters)
    .get(function(req, res) {
        Meter.find(function(err, meters) {
            if (err)
                res.send(err);

            res.json(meters);
        });
    });
    

// on routes that end in /meters/:meter_id
// ----------------------------------------------------
router.route('/meters/:meter_id')

    // get the meter with that id (accessed at GET http://localhost:4343/api/meters/:meter_id)
    .get(function(req, res) {
        Meter.findById(req.params.meter_id, function(err, meter) {
            if (err)
                res.send(err);
            res.json(meter);
        });
    })
    
    // update the meter with this id (accessed at PUT http://localhost:4343/api/meters/:meter_id)
    .put(function(req, res) {
    
        // use our meter model to find the meter we want
        Meter.findById(req.params.meter_id, function(err, meter) {

            if (err)
                res.send(err);

            meter.name = req.body.name;  // update the meters info

            // save the meter
            meter.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Meter updated!' });
            });

        });
    })

    // delete the meter with this id (accessed at DELETE http://localhost:4343/api/meters/:meter_id)
    .delete(function(req, res) {
        Meter.remove({
            _id: req.params.meter_id
        }, function(err, meter) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);



//END OF ROUTING
// =============================================================================

