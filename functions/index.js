const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore().collection("Weather Data Cache");

//Accept weather data request from client
exports.requestData = functions.https.onCall((data, context) => {
  //Check firestore database for recent data from that city
  const cityCodeRef = db.doc(data.cityCode);
  const now = new Date();
  if (now - cityCodeRef.timestamp < 900000) {
    //Send cached data to client
    return cityCodeRef;
  } else {
    //Request data from API
    fetch(`https://api.openweathermap.org/data/2.5/onecall?
      lat=${data.latitude}&
      lon=${data.longitude}&
      units=${data.units}&
      appid=826e7f95db9392bcb8f4179da8c00a4e`)
      .then(res => {
        if (res.ok) {
          res.json().then(newWeatherObj => {
            //Save data to database with new timestamp
            const newData = {
              cityName: data.cityName,
              latitude: data.latitude,
              longitude: data.longitude,
              units: data.units,
              timestamp: now,
              weatherObj: newWeatherObj
            };
            cityCodeRef.set(newData);
            //Send data to client
            return newData;
          });
        } else {
          console.error("API Request Failed!");
        }
      });
  }
});

  

  