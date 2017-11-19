// server.js

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

//Mongoose database
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/meters'); // connect to our database
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
//Database Model References
var Meter     = require('./app/models/meters');
var Lot       = require('./app/models/lots');
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 4343;        // set our port

//PayPal braintree
var gateway    = braintree.connect({  
    accessToken: 'access_token$sandbox$q987w6gt6d75b5bq$ad326f23f2af0d642cd5a9420dd65430'
});

//Cache for PayPal
var ppCache = cache();

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

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/static/Webpage.html');
  });


// test route to make sure everything is working (accessed at GET http://localhost:4343/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here

//Generate Client Tokens for PayPal API
router.get("/client_token", function (req, res) {
    gateway.clientToken.generate({}, function (err, response) {
      res.send(response.clientToken);
    });
  });

//Finalizes transactions utilizing the nonce provided by the client
router.post("/checkout", function (req, res) {

    transactionID = ppCache.getSync('transID');
    console.log(transactionID);
    ppCache.putSync('transID', (transactionID + 1));

    var added_time = req.body.added_time;
    var meter_number = req.body.meter_number;
    var nonce = req.body.nonce;
    console.log(nonce);
    console.log(meter_number);
    console.log(added_time);
    if (meter_number >= 100) {
        Meter.find({ number : meter_number }, function (err, meter) {
            var meterID = meter[0]._id;
            Meter.findById(meterID, function(err, editedMeter) {
                if (err)
                    return (err);
                var d = new Date();
                editedMeter.start_time = d.getTime();
                editedMeter.end_time = (d.getTime() + (added_time * 60 * 1000));
                editedMeter.save(function(err) {
                    if (err)
                        return (err);
                });
            });
        });
    }

    var s = "000000000" + meter_number;
    s = s.substr(s.length-4);

    console.log(s);

    // Use payment method nonce here
    var saleRequest = {
        amount: req.body.amount,
        merchantAccountId: "CAD",
        paymentMethodNonce: req.body.nonce,
        orderId: transactionID,
        descriptor: {
          name: ("SMARTMLONDON*METER" + s)
        },
        options: {
          paypal: {
            customField: ("Meter #" + meter_number),
            description: "Thanks for using Smart Meter London"
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

//Returns system time since epoch in ms
router.route('/system_time')

    // return the system time (accessed at GET http://localhost:4343/api/system_time)
    .get(function(req, res) {
        var d = new Date();

        res.json({ system_time: d.getTime() });
    });

//Allows to update whether a specific meter is occupied or not based on the meter number
router.route('/meters/number/:meter_number/update_status')
    //HACKED TOGETHER A LOT
    //Didn't want to figure out why it's not saving so it's finding the meter
    //then finding it again with the ID
    //So awful
    // edit a meter (accessed at PUT http://localhost:4343/api/meters/number/:meter_number/update_status)
    .put(function(req, res) {
        var meter_number = req.params.meter_number;
        Meter.find({ number : meter_number }, function (err, meter) {
            var meterID = meter[0]._id;
            Meter.findById(meterID, function(err, editedMeter) {
                if (err)
                    return res.send(err);
                editedMeter.is_occupied = req.body.is_occupied;
                editedMeter.save(function(err) {
                    if (err)
                        return res.send(err);
                    res.json(editedMeter);
                });
            });
        });
    });

//Retrieves meter based on meter number
router.route('/meters/number/:meter_number')

    // edit a meter (accessed at PUT http://localhost:4343/api/meters/number/:meter_number)
    .get(function(req, res) {
        var meter_number = req.params.meter_number;
        Meter.find({ number : meter_number }, function (err, meter) {
            res.json(meter);
        });
    });

// ----------------------------------------------------
// on routes that end in /all
// ----------------------------------------------------

//please never ever touch this
//it works on eleves or something else magical
router.route('/all')
    // get all the meters AND lots (accessed at GET http://localhost:4343/api/all)
    // ?type=both, meter, or lot
    // ?num=NUM, default of 50
    // gps coods: ?gps_long=BLAH, ?gps_lat=BLAH
    .get(function(req, res) {
        console.log("Entered GET function, type = " + req.query.type);
        console.log("Entered GET function, num requested = " + req.query.num);
        console.log("gps lat: " + req.query.gps_lat);
        console.log("gps long: " + req.query.gps_long);

        //Get info from query
        var long = req.query.gps_long;
        var lat = req.query.gps_lat;
        long = Math.abs(long);
        lat = Math.abs(lat);

        var arr = new Array();

        var promise1 = new Promise((resolve, reject) => {
            if (req.query.type == "both" || req.query.type == "meter") {
                mongoose.connection.db.collection('meters', function (err, collection) {
                    collection.find().forEach(function(meter) { //Iterate through elements in database
                        console.log("a meter");
                        a = Math.abs(long - Math.abs(meter.gps_long)); //Distance formula
                        b = Math.abs(lat - Math.abs(meter.gps_lat));
                        c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    
                        dist = c;
    
                        arr.push([dist, meter]);
                    });
                });
            }
            setTimeout(resolve, 1000, 'foo');
        }); 

        var promise2 = new Promise((resolve, reject) => {
            if (req.query.type == "both" || req.query.type == "lot") {
                mongoose.connection.db.collection('lots', function (err, collection) {
                    if (err)
                        console.log(err);
                    collection.find().forEach(function(meter) { //Iterate through elements in database
                        console.log("a lot");
                        a = Math.abs(long - Math.abs(meter.gps_long)); //Distance formula
                        b = Math.abs(lat - Math.abs(meter.gps_lat));
                        c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

                        dist = c;

                        arr.push([dist, meter]);
                    });
                });
            }
            setTimeout(resolve, 100, 'foo');
        }); 

        Promise.all([promise1, promise2]).then(function() {
            arr.sort(function(a, b){return a[0]-b[0]}); //Sorts to ascending order
    
            console.log(arr);
    
            //truncate if needed
            if (arr.length > req.query.num)
                arr.length = req.query.num;
    
            console.log("array truncated");
            //turn into json
            var jsonArray = {
                points: []
            };

            for (var i = 0; i < arr.length; i++) {
                console.log(i);
                console.log(arr[i][1]);
                jsonArray.points.push(arr[i][1]);
            }
            console.log(jsonArray);
    
            res.json(jsonArray);
    
            console.log(arr);
        }).catch(function () {
            console.log("Promise Rejected");
       });
    });

// ----------------------------------------------------
// on routes that end in /meters
// ----------------------------------------------------
router.route('/meters')

    // create a meter (accessed at POST http://localhost:4343/api/meters)
    .post(function(req, res) {

        var meter = new Meter();      // create a new instance of the Meter model
        var startTime = new Date();
        meter.number = req.body.number;  // set the meters number (comes from the request)
        meter.gps_long = req.body.gps_long;
        meter.gps_lat = req.body.gps_lat;
        meter.rate = req.body.rate;
	    meter.id = req.body.rate;
        meter.start_time = startTime.getTime();
        meter.end_time = req.body.end_time;
        meter.is_occupied = req.body.is_occupied;

        // save the meter and check for errors
        meter.save(function(err) {
            if (err)
                return res.send(err);

            res.json({ message: 'Meter created!' });
        });

    })

    // get all the meters (accessed at GET http://localhost:4343/api/meters)
    .get(function(req, res) {
        Meter.find(function(err, meters) {
            if (err)
                return res.send(err);

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
                return res.send(err);
            res.json(meter);
        });
    })
    
    // update the meter with this id (accessed at PUT http://localhost:4343/api/meters/:meter_id)
    .put(function(req, res) {
    
        // use our meter model to find the meter we want
        Meter.findById(req.params.meter_id, function(err, meter) {

            if (err)
                return res.send(err);

            meter.number = req.body.number;  // update the meters info

            // save the meter
            meter.save(function(err) {
                if (err)
                    return res.send(err);

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
                return res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });

// ----------------------------------------------------
// on routes that end in /lots
// ----------------------------------------------------
router.route('/lots')

    // create a meter (accessed at POST http://localhost:4343/api/lots)
    .post(function(req, res) {
        var lot = new Lot();
        var startTime = new Date();
        lot.number = req.body.number;  // set the meters number (comes from the request)
        lot.gps_long = req.body.gps_long;
        lot.gps_lat = req.body.gps_lat;
        lot.base_rate = req.body.base_rate;
        lot.real_rate = req.body.real_rate;
        lot.start_time = startTime.getTime();//in milliseconds
        lot.end_time = req.body.end_time;
        lot.capacity = req.body.capacity;
        lot.current_vehicles = req.body.current_vehicles;
        // save the lot and check for errors
        lot.save(function(err) {
            if (err)
                return res.send(err);

            res.json({ message: 'Lot created!' });
        });

    })

    // get all the lots (accessed at GET http://localhost:4343/api/lots)
    .get(function(req, res) {
        Lot.find(function(err, lots) {
            if (err)
                return res.send(err);

            res.json(lots);
        });
    });
    
// on routes that end in /lots/number/:lot_number
// ----------------------------------------------------
router.route('/lots/number/:lot_number')


    // get the lot with that id (accessed at GET http://localhost:4343/api/lots/number/:lot_number)
    .get(function(req, res) {
        var lot_number = req.params.lot_number;
        Lot.find({ number : lot_number }, function (err, lot) {
            res.json(lot);
        });
        
    })

// on routes that end in /lots/:lot_id
// ----------------------------------------------------
router.route('/lots/:lot_id')

    // get the lot with that id (accessed at GET http://localhost:4343/api/lots/:lot_id)
    .get(function(req, res) {
        Lot.findById(req.params.lot_id, function(err, lot) {
            if (err)
                return res.send(err);
            res.json(lot);
        });
    })
    
    // update the lot with this id (accessed at PUT http://localhost:4343/api/lots/:lot_id)
    .put(function(req, res) {
        // use our lot model to find the lot we want
        Lot.findById(req.params.lot_id, function(err, lot) {

            if (err)
                return res.send(err);

            lot.number = req.body.number;  // update the meters info
            lot.current_vehicles = req.body.current_vehicles;
            lot.start_time = req.body.start_time;
            lot.end_time = req.body.end_time;

            // save the lot
            lot.save(function(err) {
                if (err)
                    return res.send(err);

                res.json({ message: 'Lot updated!' });
            });

        });
    })

    // delete the lot with this id (accessed at DELETE http://localhost:4343/api/lots/:lot_id)
    .delete(function(req, res) {
         Lot.remove({
            _id: req.params.lot_id
        }, function(err, lot) {
            if (err)
                return res.send(err);

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

