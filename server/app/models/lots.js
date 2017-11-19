// app/models/lots.js
//base/ real cost 

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var LotSchema   = new Schema({
    number: Number,
    gps_long: Number,
    gps_lat: Number,
    base_rate: Number,
    real_rate: Number,
    start_time: Number,
    end_time: Number,
    capacity: Number,
    current_vehicles: Number
});

module.exports = mongoose.model('Lot', LotSchema);