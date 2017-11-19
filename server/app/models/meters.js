// app/models/meters.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MeterSchema   = new Schema({
    number: Number,
    gps_long: Number,
    gps_lat: Number,
    rate: Number,
    id: Number,
    start: Number,
    end: Number,
    is_occupied: Boolean
});

module.exports = mongoose.model('Meter', MeterSchema);