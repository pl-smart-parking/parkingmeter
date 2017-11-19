// app/models/payments.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var PaymentSchema   = new Schema({
    number: Number,
    gps_long: Number,
    gps_lat: Number,
    rate: Number,
    start: Number,
    end: Number,
    is_occupied: Boolean
});

module.exports = mongoose.model('Meter', MeterSchema);