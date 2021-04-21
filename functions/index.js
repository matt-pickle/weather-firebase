const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
admin.initializeApp();
const db = admin.firestore().collection("Weather Data Cache");

exports.requestData = functions.https.onRequest(async (req, res) => {
  const cityData = await db.doc(req.body.cityCode).get();
  const now = Date.now();
  if (cityData.exists && now - cityData.data().timestamp < 900000) {
    res.send(cityData.data());
  } else {
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${req.body.latitude}&lon=${req.body.longitude}&units=metric&appid=${functions.config().openweather.key}`)
      .then(response => {
        if (response.ok) {
          response.json().then(newWeatherObj => {
            const newData = {
              cityName: req.body.cityName,
              latitude: req.body.latitude,
              longitude: req.body.longitude,
              timestamp: now,
              weatherObj: newWeatherObj
            };
            db.doc(req.body.cityCode).set(newData);
            res.send(newData);
          })
        } else {
          throw new Error("API Request Failed!");
        }
      })
      .catch(err => {
        console.error(err.message);
        res.status(500).send(err.message);
      })
  }    
});

  

  