const mongoose = require('mongoose');
const ProvinceSchema = new mongoose.Schema({
	name: String,
	countryCode: String
});
module.exports = mongoose.model('Province', ProvinceSchema);
