// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

//Mongoose database
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/meters'); // connect to our database

//Database Model References
var Meter     = require('./app/models/meters');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 4343;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests


router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});


// test route to make sure everything is working (accessed at GET http://localhost:4343/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// more routes for our API will happen here

// on routes that end in /meters
// ----------------------------------------------------
router.route('/meters')

    // create a meter (accessed at POST http://localhost:4343/api/meters)
    .post(function(req, res) {

        var meter = new Meter();      // create a new instance of the Meter model
        meter.name = req.body.name;  // set the meters name (comes from the request)

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