const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
admin.initializeApp();
const db = admin.firestore().collection("Weather Data Cache");

//Accept weather data request from client
exports.requestData = functions.https.onRequest(async (req, res) => {
  //Check firestore database for recent data from that city
  const cityData = await db.doc(req.body.data.cityCode).get();
  const now = Date.now();
  if (cityData.exists && now - cityData.data().timestamp < 900000) {
    //Send cached data to client
    res.send(cityData.data());
  } else {
    //Request data from API
    fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${req.body.data.latitude}&lon=${req.body.data.longitude}&units=${req.body.data.units}&appid=${functions.config().openweather.key}`)
      .then(response => {
        if (response.ok) {
          response.json().then(newWeatherObj => {
            const newData = {
              cityName: req.body.data.cityName,
              latitude: req.body.data.latitude,
              longitude: req.body.data.longitude,
              units: req.body.data.units,
              timestamp: now,
              weatherObj: newWeatherObj
            };
            db.doc(req.body.data.cityCode).set(newData);
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

  

  