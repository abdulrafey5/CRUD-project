const mongoose = require('mongoose');
const Province = require('./models/Province');
const City = require('./models/City');

mongoose.connect('mongodb://127.0.0.1:27017/locationdb', { 
  useNewUrlParser: true, useUnifiedTopology: true 
}).then(async () => {
  await Province.deleteMany();
  await City.deleteMany();

  const punjab = await new Province({ name: 'Punjab', countryCode: 'PK' }).save();
  const sindh = await new Province({ name: 'Sindh', countryCode: 'PK' }).save();

  await new City({ name: 'Lahore', provinceId: punjab._id, lat: 31.5204, lng: 74.3587 }).save();
  await new City({ name: 'Karachi', provinceId: sindh._id, lat: 24.8607, lng: 67.0011 }).save();

  console.log('Seed done');
  process.exit();
});

