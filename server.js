// server.js (CommonJS)
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();
const GEONAMES_USER = process.env.GEONAMES_USER;
if (!GEONAMES_USER) {
  console.error('❌ Missing GEONAMES_USER in .env');
  process.exit(1);
}

const ProvinceSchema = new mongoose.Schema({
  name: String,
  countryCode: String
});
const CitySchema = new mongoose.Schema({
  name: String,
  provinceId: mongoose.Schema.Types.ObjectId,
  lat: Number,
  lng: Number
});
const LocationSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' }
});
const Province = mongoose.model('Province', ProvinceSchema);
const City = mongoose.model('City', CitySchema);
const Location = mongoose.model('Location', LocationSchema);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/locationdb', {
  useNewUrlParser: true, useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;

/** 🌍 REST Countries **/
app.get('/countries', async (req, res) => {
  try {
    const r = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name');
    const data = await r.json();
    const countries = data.map(c => ({ code: c.cca2, name: c.name.common }));
    res.json(countries);
  } catch (e) {
    console.error('Error:', e); res.status(500).send('Error fetching countries');
  }
});

/** 📌 GeoNames provinces **/
app.get('/countries/:code/provinces', async (req, res) => {
  try {
    const countryCode = req.params.code;
    let r = await fetch(`http://api.geonames.org/countryInfoJSON?country=${countryCode}&username=${GEONAMES_USER}`);
    let j = await r.json();
    if (!j.geonames?.length) return res.status(404).send('Country not found');
    const countryId = j.geonames[0].geonameId;

    r = await fetch(`http://api.geonames.org/childrenJSON?geonameId=${countryId}&username=${GEONAMES_USER}`);
    j = await r.json();
    const provinces = j.geonames?.map(p => ({ id: p.geonameId, name: p.name })) || [];
    res.json(provinces);
  } catch (e) {
    console.error('Error:', e); res.status(500).send('Error fetching provinces');
  }
});

/** 🏙 GeoNames cities **/
app.get('/provinces/:id/cities', async (req, res) => {
  try {
    const provinceId = req.params.id;
    let r = await fetch(`http://api.geonames.org/getJSON?geonameId=${provinceId}&username=${GEONAMES_USER}`);
    let p = await r.json();
    if (!p.geonameId) return res.status(404).send('Province not found');
    const url = `http://api.geonames.org/searchJSON?country=${p.countryCode}&adminCode1=${p.adminCode1}&featureClass=P&maxRows=500&username=${GEONAMES_USER}`;
    r = await fetch(url);
    const j = await r.json();
    const cities = j.geonames?.map(c => ({ id: c.geonameId, name: c.name, lat: parseFloat(c.lat), lng: parseFloat(c.lng) })) || [];
    res.json(cities);
  } catch (e) {
    console.error('Error:', e); res.status(500).send('Error fetching cities');
  }
});

/** ✅ MongoDB CRUD provinces **/
app.post('/provinces', async (req, res) => { const p = new Province(req.body); await p.save(); res.json(p); });
app.delete('/provinces/:id', async (req, res) => { await Province.findByIdAndDelete(req.params.id); res.send('Deleted'); });
app.get('/db/provinces', async (req, res) => { const ps = await Province.find(); res.json(ps); });

/** ✅ MongoDB CRUD cities **/
app.post('/cities', async (req, res) => { const c = new City(req.body); await c.save(); res.json(c); });
app.delete('/cities/:id', async (req, res) => { await City.findByIdAndDelete(req.params.id); res.send('Deleted'); });
app.get('/db/cities/:provinceId', async (req, res) => {
  const cs = await City.find({ provinceId: req.params.provinceId }); res.json(cs);
});

/** 🆕 MongoDB CRUD locations **/
app.post('/locations', async (req, res) => { const l = new Location(req.body); await l.save(); res.json(l); });
app.delete('/locations/:id', async (req, res) => { await Location.findByIdAndDelete(req.params.id); res.send('Deleted'); });
app.get('/db/locations', async (req, res) => { const ls = await Location.find(); res.json(ls); });

/** Health check **/
app.get('/health', (req, res) => res.send('OK'));

/** Start **/
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));

