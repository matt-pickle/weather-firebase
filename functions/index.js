const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
admin.initializeApp();
const db = admin.firestore().collection("Weather Data Cache");

//Accept weather data request from client
exports.requestData = functions.https.onCall(async (data) => {
  //Check firestore database for recent data from that city
  const cityData = await db.doc(data.cityCode).get();
  const now = Date.now();
  if (cityData.exists && now - cityData.data().timestamp < 900000) {
    //Send cached data to client
    return cityData.data();
  } else {
    //Request data from API
    return fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${data.latitude}&lon=${data.longitude}&units=${data.units}&appid=${functions.config().openweather.key}`)
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          throw new Error("API Request Failed!");
        }
      })
      .then(newWeatherObj => {
        //Save data to database with new timestamp
        const newData = {
          cityName: data.cityName,
          latitude: data.latitude,
          longitude: data.longitude,
          units: data.units,
          timestamp: now,
          weatherObj: newWeatherObj
        };
        db.doc(data.cityCode).set(newData);
        //Send data to client
        return newData;
      })
      .catch(err => {
        console.error(err.message);
        return err.message;
      })
  }    
});

  

  