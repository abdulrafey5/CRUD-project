const mongoose = require('mongoose');
const CitySchema = new mongoose.Schema({

	name: String,
	provinceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Province' },
	lat: Number,
	lng: Number
});
module.exports = mongoose.model('City', CitySchema);

