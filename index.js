require("dotenv").config();
const express = require("express");

const fs = require("fs");
const session = require("express-session");
const emailjs = require("@emailjs/nodejs");
const path = require("path");
const MongoStore = require("connect-mongo");
const { ObjectId } = require("mongodb");

const port = process.env.PORT || 3001;

const bcrypt = require("bcrypt");

const saltRounds = 12;

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

const Joi = require("joi");

const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEN_AI_KEY });

const app = express();

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
  // Do not allow headless browsers
  blockHeadless: true,
  limitRate: {
    // Set the limit rate for the application
    id: 'app',
    // Allow 1 request per 10s
    throttle: 10000,
  },
});

app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));
app.use("/text", express.static("./public/text"));
app.use("/font", express.static("./public/font"));
//app.use("/html", express.static("./app/html"));
app.use("/snippets", express.static("./public/snippets"));
app.use("/uploads", express.static("./uploads"));

app.set("view engine", "ejs");

//mongodb variables
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

let { database } = require("./databaseConnection.js");
const { error } = require("console");

//database collections
const userCollection = database.db(mongodb_database).collection("users");
const storiesCollection = database.db(mongodb_database).collection("stories");
const alertLocationsCollection = database.db(mongodb_database).collection("alertLocations");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// this is the session middleware, that will create a session for the user
var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    resave: true,
    saveUninitialized: false,
  })
);

const url = `https://riskmapper.onrender.com/`; // Replace with Render URL
const interval = 300000; // (840000 14mins, 300000 5mins)

//Reloader Function to ping server on regular basis
//code modified from: https://dev.to/harshgit98/solution-for-rendercom-web-services-spin-down-due-to-inactivity-2h8i
function reloadWebsite() {
  fetch(url)
    .then((response) => {
      console.log(
        `Reloaded at ${new Date().toISOString()}: Status Code ${response.status
        }`
      );
    })
    .catch((error) => {
      console.error(
        `Error reloading at ${new Date().toISOString()}:`,
        error.message
      );
    });
}
const reloader = setInterval(reloadWebsite, interval);

//sets up climate alert monitoring
const alertTime = 10800000; //3 hours 10800000
const alertInterval = setInterval(monitorAlerts, alertTime);

app.use(function (req, res, next) {
  res.locals.authenticated = req.session.authenticated;
  next();
});

// route for landing page
app.get("/", function (req, res) {
  res.render("index");
});

//route for home page
app.get("/main", function (req, res) {
  res.render("main");
});

// this is the login page
app.get("/login", function (req, res) {
  if (!req.session.authenticated) {
    res.render("login");
  } else {
    res.redirect("/main");
  }
});

// this will submit the login data to the database to check if the user exists
app.post("/login", async (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password.trim();
  let details = [];

  const schema = Joi.string().max(20).required().label("username");
  const validationResult = schema.validate(username);
  if (validationResult.error != null) {
    details.push(validationResult.error["details"][0].message);
    res.render("login", {
      error: details,
      username: username,
      password: password,
    });
    return;
  }

  const result = await userCollection.findOne(
    { username: username },
    { projection: { username: 1, password: 1, _id: 1 } }
  );

  console.log(result);
  if (!result) {
    details.push("Username not found");
    res.render("login", {
      error: details,
      input: { username: username, password: password },
    });
    return;
  }
  if (await bcrypt.compare(password, result.password)) {
    req.session.authenticated = true;
    req.session.username = username;
    req.session.cookie.maxAge = expireTime;
    req.session.userID = result._id;
    app.locals.loggedIn = true;
    app.locals.username = username;
    res.redirect("/main"); //****change this to something else after user is logged in
    return;
  } else {
    if (password.length > 0) {
      details.push("Incorrect password");
    } else {
      details.push("Empty password");
    }
    res.render("login", {
      error: details,
      input: { username: username, password: password },
    });
    return;
  }
});

// this is the signup page
app.get("/signup", function (req, res) {
  if (!req.session.authenticated) {
    res.render("signup");
  } else {
    res.redirect("/main");
  }
});

// this is the post request for the signup page, used to submit user data to the database
app.post("/signup", async (req, res) => {
  const name = req.body.name.trim();
  const email = req.body.email.trim();
  const username = req.body.username.trim();
  const password = req.body.password.trim();
  let details = [];
  const schema = Joi.object({
    name: Joi.string().alphanum().max(20).required(),
    username: Joi.string().alphanum().max(20).required(),
    email: Joi.string()
      .max(30)
      .email({ minDomainSegments: 2 })
      .required(),
    password: Joi.string().min(8).max(20).required(),
  });

  const validationResult = schema.validate(
    { name, username, email, password },
    { abortEarly: false }
  );
  if (validationResult.error != null) {
    for (let detail of validationResult.error["details"]) {
      details.push(detail.message);
    }
  }
  // will check if the username or email already exists in the database
  const existingUser = await userCollection.findOne({ username: username });
  const existingEmail = await userCollection.findOne({ email: email });
  if (existingUser && username.length > 0) {
    details.push("Username already in use");
  }
  if (existingEmail && email.length > 0) {
    details.push("Email already in use");
  }
  if (details.length > 0) {
    res.render("signup", {
      error: details,
      input: {
        name: name,
        email: email,
        username: username,
        password: password,
      },
    });
    return;
  }
  // hashes the password with bcrypt
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // this part inserts the user into the database
  const user = {
    name: name,
    email: email,
    username: username,
    password: hashedPassword,
    currentSearchLocation: null,
    savedLocation: [],
    alreadyAlerted: [],
  };

  let record = await userCollection.insertOne(user);
  req.session.authenticated = true;
  req.session.username = username;
  req.session.cookie.maxAge = expireTime;
  req.session.userID = record.insertedId;

  res.redirect("/login");
});

// this is the logout page, will be used to destory the session and redirect to the login page
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      //console.error("Error during logout: ", err);
      //res.status(500).send("Internal Server Error");
      let message = "Error logging out";
      res.redirect(`/errors?message=${message}`);
    } else {
      app.locals.loggedIn = false;
      res.redirect("/login");
    }
  });
});

//recieves coordinates array of an location
//sends back ai response created using cordinates of the location
app.post("/ai", async (req, res) => {
  try {
    let { long, lat } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Present a speculative vision summary of the climate of area  with longitude ${long} and latitude ${lat} in the 
                next 10, 20, or 50 years based on available scientific data. Do not mention the coordinates.

                Mention the general location. Keep it within 50 words.`,
    });
    let text = response.text;
    //console.log(response.text)
    res.send(text);
  } catch (error) {
    let message = "Error retrieving response";
    res.redirect(`/errors?message=${message}`);
  }
});

//climate alert keywords used to detect alerts
const floodWords = ["flood", "rainfall"];
const heatWords = ["heat", "fire"];

//get alerts from weather api based on coordinates
//returns an array of alert objects with properties: id, type (flood/heat), severity, description, img and link (to adaptation page)
function getAlerts(long, lat) {
  return new Promise(async (resolve, reject) => {
    try {
      let results = [];
      let alreadyAlertedFlood = false;
      let alreadyAlertedHeat = false;

      //gets climate alerts from weather api back as an array of alert objects
      const url = `http://api.weatherapi.com/v1/alerts.json?key=${process.env.WEATHER_API_KEY}&q=${lat},${long}`;
      const response = await fetch(url);
      const alertsJson = await response.json();
      let alertsArray = alertsJson.alerts.alert;

      //iterate through each alert
      alertsArray.forEach((alert) => {
        if (!alreadyAlertedFlood) {
          //check if alert content matchs with the flood alert keywords
          floodWords.forEach((keyword) => {
            if (
              !alreadyAlertedFlood &&
              (alert.headline.includes(keyword) ||
                alert.category.includes(keyword) ||
                alert.event.includes(keyword) ||
                alert.desc.includes(keyword))
            ) { 
              //add alert to list of screened alerts if alert content matches with keywords
              results.push({
                id:
                  alert.event +
                  alert.severity +
                  alert.areas +
                  alert.effective.slice(0, 7),
                type: "flood",
                description: "Heavy rainfall or flooding",
                severity: alert.severity,
                img: "/img/floodRiskIcon.png",
                link: "/floodAdapt",
              });
              alreadyAlertedFlood = true;
            }
          });
        }
        if (!alreadyAlertedHeat) {
          //check if alert content matchs with the heat alert keywords
          heatWords.forEach((keyword) => {
            if (
              !alreadyAlertedHeat &&
              (alert.headline.includes(keyword) ||
                alert.category.includes(keyword) ||
                alert.event.includes(keyword) ||
                alert.desc.includes(keyword))
            ) {
              //add alert to list of screened alerts if alert content matches with keywords
              results.push({
                id:
                  alert.event +
                  alert.severity +
                  alert.areas +
                  alert.effective.slice(0, 7),
                type: "heat",
                description: "Fire or Extreme Heat",
                severity: alert.severity,
                img: "/img/heatRiskIcon.png",
                link: "/heatAdapt",
              });
              alreadyAlertedHeat = true;
            }
          });
        }
      });
      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
}

//check if locations saved in alertLocations collection has climate alerts
//and sends alerts to users
async function monitorAlerts() {
  try {
    let alertLocations = await alertLocationsCollection.find({}).toArray();

    alertLocations.forEach(async (alertLocation) => {
      let [long, lat] = alertLocation.location.geometry.coordinates;
      let locationName = alertLocation.location.properties.name_preferred;
      let users = alertLocation.users;
      let alerts = await getAlerts(long, lat);
      if (alerts.length > 0) {
        alerts.forEach((alert) => {
          sendAlerts(alert, locationName, users);
        });
      }
      //console.log(locationName + " " + users);
    });
  } catch (error) {
    console.error("Error obtaining alert location information: ", error);
  }
}

//send email alerts
//params: alert(object), locationName(name of alert location), users(array of user _id)
async function sendAlerts(alert, locationName, users) {
  for (let i = 0; i < users.length; i++) {
    //checks if user has previously recieved this alert
    let userID = new ObjectId(users[i]);
    let alertedObject = await userCollection.findOne(
      { _id: userID },
      { projection: { alreadyAlerted: 1, email: 1, name: 1 } }
    );
    if (!alertedObject.hasOwnProperty("alreadyAlerted")) {
      console.log("unable to find user: " + users[i]);
      return;
    }
    let alreadyAlerted = alertedObject.alreadyAlerted;

    //if alert is new, add this alert to the user's alreadyAlerted field
    if (!alreadyAlerted.includes(alert.id)) {
      let userEmail = alertedObject.email;
      let userName = alertedObject.name;
      await userCollection.updateOne(
        { _id: userID },
        { $push: { alreadyAlerted: alert.id } }
      );
      // send email alert
      let templateParams = {
        name: userName,
        email: userEmail,
        location: locationName,
        type: alert.type,
        severity: alert.severity,
        description: alert.description,
        link: "https://riskmapper.onrender.com/policy"
      };
      emailjs.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, templateParams).then(
        (response) => {
          console.log('SUCCESS!', response.status, response.text);
        },
        (error) => {
          console.log('FAILED...', error);
        },
      );
    } else {
      console.log("already been alerted");
    }
  }
}

//renders environment risks info using information from getAlerts();
app.post("/getRisks", async (req, res) => {
  let [long, lat] = req.body;
  if (long && lat) {
    try {
      let alerts = await getAlerts(long, lat);
      if (alerts.length > 0) {
        res.render("main/risks", { alerts: alerts, message: "" });
      } else {
        let message =
          "There are currently no flood or heat risks for this location.";
        res.render("main/risks", { alerts: [], message: message });
      }
    } catch (error) {
      res.status(500).send("Unable to get risk information");
    }
  } else {
    let message = "Unable to determine the location. Please search again.";
    res.render("main/risks", { alerts: [], message: message });
  }
});

//recieves user's current search location (Geojson object) and updates it in the database
app.post("/recordCurrentLocation", async function (req, res) {
  if (req.session.authenticated) {
    try {
      const { currentLocation } = req.body; 

      await userCollection.updateOne(
        { _id: new ObjectId(req.session.userID) },
        {
          $set: { currentSearchLocation: currentLocation },
        }
      );
      res.status(201).send("Location saved successfully");
    } catch (error) {
      let message = "Error saving user location";
      res.redirect(`/errors?message=${message}`);
    }
  } else {
    res.send("User not logged in");
  }
});

//recieves alert notification status, saves the alert status and current search location in database
app.post("/saveLocation", async function (req, res) {
  //gets the alert notification status (whether user wants to recieve alerts for the location)
  let { alert } = req.body;
  
  if (req.session.authenticated) {
    try {
      //gets the user's current search location
      let userID = new ObjectId(req.session.userID);
      const result = await userCollection.findOne(
        { _id: userID },
        { projection: { currentSearchLocation: 1 } }
      );

      //updates user's saved location with the current search location and alert status 
      let savedLocation = {
        location: result.currentSearchLocation,
        alert: alert,
      };
      await userCollection.updateOne(
        { _id: userID },
        { $push: { savedLocation } }
      );

      //if user wants to recieve alerts for the location add it to the alertsLocation collection
      if (alert) {
        //checks if location is aleady in the alertsLocation collection
        const alertResult = await alertLocationsCollection.findOne(
          { location: result.currentSearchLocation },
          { projection: { _id: 1 } }
        );

        //if location alerady exists, add user to existing location
        if (alertResult && alertResult.hasOwnProperty("_id")) {
          await alertLocationsCollection.updateOne(
            { _id: new ObjectId(alertResult._id) },
            { $push: { users: userID } }
          );

        //if location doesn't exist add new location document into alertsLocation collection
        } else {
          let alertLocation = {
            location: result.currentSearchLocation,
            users: [userID],
          };
          await alertLocationsCollection.insertOne(alertLocation);
        }
      }
      res.status(201).send("Location saved");
    } catch (error) {
      let message = "Error saving location";
      res.redirect(`/errors?message=${message}`);
    }
  } else {
    res.send("User not logged in");
  }
});

//sends user's current search location as object with coordinate and name properties
//sends null if current search location is not found
app.get("/getCurrentSearchLocation", async function (req, res) {
  if (req.session.authenticated) {
    try {
      let userID = new ObjectId(req.session.userID);
      let data = null;
      const result = await userCollection.findOne(
        { _id: userID },
        { projection: { currentSearchLocation: 1 } }
      );
      if (result.currentSearchLocation) {
        data = {
          coordinate: result.currentSearchLocation.geometry.coordinates,
          address: result.currentSearchLocation.properties.full_address,
        };
      }
      res.send(data);
    } catch (error) {
      let message = "Error getting user's current search location";
      res.redirect(`/errors?message=${message}`);
    }
  } else {
    res.send("User not logged in");
  }
});

//middleware to check if current search location is already in saved location
//saves results in req.session
async function locationSaved(req, res, next) {
  let isSaved = "false";

  if (req.session.authenticated) {
    //gets user's current search location and saved locations from database
    let userID = new ObjectId(req.session.userID);
    const result = await userCollection.findOne(
      { _id: userID },
      { projection: { savedLocation: 1, currentSearchLocation: 1 } }
    );

    //gets address of current search location
    if (result.currentSearchLocation) {
      let currentLocationProperties = result.currentSearchLocation.properties;
      let currentAddress = currentLocationProperties.full_address;
      
      //compares address of current search location with that of each location in saved locations
      let locationArray = result.savedLocation;
      locationArray.forEach((saved) => {
        let address = saved.location.properties.full_address;
        if (address === currentAddress) {
          isSaved = "true";
        }
      });
    }
  }
  //stores if location is saved in req.session
  req.session.isLocationSaved = isSaved;
  next();
}

//uses locationSaved middleware to send if currently searched location is already saved in database
app.get("/checkLocationSaved", locationSaved, function (req, res) {
  res.send(req.session.isLocationSaved);
  return;
});

//sends 'save location' popup on main page
app.get("/popup", locationSaved, (req, res) => {

  //if location has previously saved
  if (req.session.isLocationSaved == "true") {
    res.render("main/savedPopup");

  //if location has not previously been saved
  } else if (req.session.authenticated) {
    res.render("main/alertPopup");

  //if user is not logged in
  } else {
    res.render("main/loginPopup");
  }
});

//sends popup for delete confirmation
app.get("/deletePopup", (req, res) => {
  try {
    res.render("savedLocations/deletePopup");
  } catch (error) {
    //console.error("Error rendering EJS template:", error);
    res.status(500).send("Error rendering template.");
  }
});

//display list of saved locations
app.get("/displaySavedLocations", async (req, res) => {

  //gets user's saved locations array from the database
  let userID = new ObjectId(req.session.userID);
  try {
    let result = await userCollection.findOne(
      { username: req.session.username },
      { projection: { savedLocation: 1 } }
    );
    let locationArray = result.savedLocation;
    
    //renders list of saved locations
    if (locationArray.length == 0) {
      res.render("savedLocations/location", {
        locationArray: [],
        message: "No Saved Locations",
      });
    } else {
      res.render("savedLocations/location", {
        locationArray: locationArray,
        message: "",
      });
    }
  } catch (error) {
    res.status(500).send("Error displaying saved location.");
  }
});

//recieves location id and alert notification status
//deletes location from saved location and alerts location in the database
app.post("/deleteLocation", async (req, res) => {
  let { locationId, alertOn } = req.body;

  let userID = new ObjectId(req.session.userID);
  try {
    //gets user's saved locations from the database
    let result = await userCollection.findOne(
      { _id: userID },
      { projection: { savedLocation: 1 } }
    );

    //remove location from user's saved location in th database
    await userCollection.updateOne(
      { _id: userID },
      { $pull: { savedLocation: { "location.id": locationId } } }
    );

    //removes location/user from alert location in database
    if (alertOn) {
      //finds location in alert locations collection and gets list of associated users
      const alertResult = await alertLocationsCollection.findOne(
        { "location.id": locationId },
        { projection: { _id: 1, users: 1 } }
      );

      if (
        //if location is in alerts location and there is more than 1 user associated with the location,
        //remove this user from the users list
        alertResult && alertResult.hasOwnProperty("_id") && alertResult.users.length > 1) {
        let docID = new ObjectId(alertResult._id);
        await alertLocationsCollection.updateOne(
          { _id: docID },
          { $pull: { users: userID } }
        );
        res.status(200).send("User removed from alert location");

        //if there is only one user associated with the location, delete location document from alert locations collection
      } else if (alertResult && alertResult.hasOwnProperty("_id")) {
        let docID = new ObjectId(alertResult._id);
        await alertLocationsCollection.deleteOne({ _id: docID });
        res.status(200).send("Alert location deleted");

      } else {
        res.status(200).send("Location not in alertLocation");
      }
    } else {
      res.status(200).send("Location deleted from savedLocation");
    }
  } catch (error) {
    let message = "Error deleting saved location";
    res.redirect(`/errors?message=${message}`);
  }
});

//recieves location id and alert notification status
//updates alert status in saved locations and adds/delete location/user in alerts location collection in the database
app.post("/updateAlert", async (req, res) => {

  let { locationId, newAlert } = req.body;

  let userID = new ObjectId(req.session.userID);
  try {
    //updates alerts notification status in savedLocations
    await userCollection.updateOne(
      {
        _id: userID,
        savedLocation: { $elemMatch: { "location.id": locationId } },
      },
      { $set: { "savedLocation.$.alert": newAlert } }
    );

    //finds location object from user's saved locations using location id
    let locationResult = await userCollection.findOne(
      {
        _id: userID,
        savedLocation: { $elemMatch: { "location.id": locationId } },
      },
      { projection: { "savedLocation.$": 1 } }
    );
    let location = locationResult.savedLocation[0].location;

    //finds location in the alerts location database and gets its id and list of users
    const alertResult = await alertLocationsCollection.findOne(
      { "location.id": locationId },
      { projection: { _id: 1, users: 1 } }
    );

    //if the location's alert notification is toggled on
    if (newAlert) {
      //if location already exists in alerts Location collection, add user to its list of users
      if (alertResult && alertResult.hasOwnProperty("_id")) {
        let docID = new ObjectId(alertResult._id);
        await alertLocationsCollection.updateOne(
          { _id: docID },
          { $push: { users: userID } }
        );
      //if location is not in alerts location collection, add new location document
      } else {
        let alertLocation = {
          location: location,
          users: [userID],
        };
        await alertLocationsCollection.insertOne(alertLocation);
      }
      res.status(200).send("alert location updated");

    //if the location's alert notification is toggled off
    } else {
      //if location alerady exists in alerts location collection, and there is more than 1 user
      //in it's associated user's list, remove this user from the list
      if (alertResult && alertResult.hasOwnProperty("_id") && alertResult.users.length > 1) {
        let docID = new ObjectId(alertResult._id);
        await alertLocationsCollection.updateOne(
          { _id: docID },
          { $pull: { users: userID } }
        );
        res.status(200).send("alert location updated");
      
      //if location already exists in alerts location collection, and there is only 1 associated user,
      //remove location document from collection
      } else if (alertResult && alertResult.hasOwnProperty("_id")) {
        let docID = new ObjectId(alertResult._id);
        await alertLocationsCollection.deleteOne({ _id: docID });
        res.status(200).send("alert location updated");

      } else {
        let message = "Error updating alert location database";
        res.redirect(`/errors?message=${message}`);
      }
    }
  } catch (error) {
    let message = "Error updating saved location alerts.";
    res.redirect(`/errors?message=${message}`);
  }
});

//this is the profile page, used to display the user profile information
app.get("/profile", async function (req, res) {
  if (req.session.authenticated) {
    let result = await userCollection.findOne(
      { username: req.session.username },
      { projection: { name: 1, email: 1 } }
    );
    res.render("profile", { name: result.name, email: result.email });
  } else {
    res.redirect("/main");
  }
});

app.post("/profileUpdate", async function (req, res) {
  if (req.session.authenticated) {
    res.setHeader("Content-Type", "application/json");
    let name = req.body.name.trim();
    let email = req.body.email.trim();
    let details = [];
    const schema = Joi.object({
      name: Joi.string().alphanum().max(20).required(),
      email: Joi.string()
        .max(30)
        .email({ minDomainSegments: 2 })
        .required()
    });

    const validationResult = schema.validate(
      { name, email },
      { abortEarly: false }
    );
    if (validationResult.error != null) {
      for (let detail of validationResult.error["details"]) {
        details.push(detail.message);
      }
    }
    // will check if the username or email already exists in the database
    // have to make it understand which value is changed and check that one
    const existingEmail = await userCollection.findOne({
      $and: [
        { username: { $not: { $eq: req.session.username } } },
        { email: email }
      ]
    });
    if (existingEmail && email.length > 0) {
      details.push("Email already in use");
    }
    if (details.length > 0) {
      res.render("profile", { error: details });
    } else {
      await userCollection.updateOne(
        { username: req.session.username },
        {
          $set: { name: name, email: email },
        }
      );
    }

  } else {
    res.redirect("/main");
  }
});

//renders the flood adaptation tips page
app.get("/floodAdapt", (req, res) => {
  let categories = [
    { name: "protect", heading: "Protect Your Home and Property" },
    { name: "plan", heading: "Make an Emergency Plan" },
    { name: "bag", heading: "Make Grab-and-Go Bags" },
    { name: "insurance", heading: "Research insurance options" },
  ];
  res.render("floodAdapt", { categories: categories });
});

//renders the expandable content in flood adaptation tips page
app.get("/flood/:content", function (req, res) {
  switch (req.params.content) {
    case "protect":
      res.render("flood/floodProtect");
      break;
    case "plan":
      res.render("flood/floodPlan");
      break;
    case "bag":
      res.render("flood/floodBag");
      break;
    case "insurance":
      res.render("flood/floodInsurance");
      break;
    default:
      res.status(404);
      res.send("Content not found");
  }
});

//renders the heat adaptation tips page
app.get("/heatAdapt", function (req, res) {
  let categories = [
    { name: "atRisk", heading: "Who is most at risk" },
    { name: "buddy", heading: "Pick a heat buddy" },
    { name: "prepare", heading: "Prepare your home" },
    { name: "indoors", heading: "How to stay cool indoors" },
    { name: "outdoors", heading: "How to stay cool outdoors" },
    { name: "overheat", heading: "Overheating" },
    { name: "wildfire", heading: "Extreme Heat and Wildfires" },
    { name: "drought", heading: "Extreme Heat and Drought" }
  ];
  res.render("heatAdapt", { categories: categories });
});

//renders the expandable content in heat adaptation tips page
app.get("/heat/:content", function (req, res) {
  switch (req.params.content) {
    case "atRisk":
      res.render("heat/heatAtRisk");
      break;
    case "buddy":
      res.render("heat/heatBuddy");
      break;
    case "prepare":
      res.render("heat/heatPrepare");
      break;
    case "indoors":
      res.render("heat/heatIndoors");
      break;
    case "outdoors":
      res.render("heat/heatOutdoors");
      break;
    case "overheat":
      res.render("heat/heatOverheating");
      break;
    case "wildfire":
      res.render("heat/heatWildfire");
      break;
    case "drought":
      res.render("heat/heatDrought");
      break;
    default:
      res.status(404);
      res.send("Content not found");
  }
});

//sends the mapbox access token
app.get("/mapboxToken", function (req, res) {
  res.send({ token: process.env.MAPBOX_ACCESS_TOKEN });
});

app.get("/mapboxTokenLayer", (req, res) => {
  res.send({ token: process.env.TOKENAPI });
});

//
app.get("/stories", function (req, res) {
  res.render("stories");
});

//renders the saved locations page, redirects to login if user is not logged in
app.get("/savedLocation", function (req, res) {
  if (req.session.authenticated) {
    res.render("savedLocation");
  } else {
    res.redirect("/login");
  }

});

//sends user's authentication status
app.get("/authenticated", function (req, res) {
  if (req.session.authenticated) {
    res.send("true");
  } else {
    res.send("false");
  }
});

app.get("/policy", function (req, res) {
  res.render("policy");
});

app.get("/sessionInfo", (req, res) => {
  if (req.session.authenticated) {
    res.json({
      username: req.session.username,
      userID: req.session.userID,
    });
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
});

// Route to GET all stories
app.get("/api/stories", async (req, res) => {
  try {
    const stories = await storiesCollection.find().toArray();
    res.status(200).json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching stories." });
  }
});

// Route to get a single story by ID
app.get("/api/stories/:id", async (req, res) => {
  console.log("/api/stories/:id route hit!");

  try {
    const { id } = req.params;
    const story = await storiesCollection.findOne({ _id: new ObjectId(id) });

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    res.json(story);
  } catch (err) {
    console.error("Error fetching story by ID:", err);
    res.status(500).json({ error: "Error fetching story" });
  }
});

// Route to handle story submissions (POST to /api/posts), accepting form data with optional image upload and saving it to the MongoDB collection
const multer = require("multer");
const { rejects } = require("assert");
const upload = multer({ dest: "uploads/" }); // You can customize storage options if needed

app.post("/api/stories", upload.single("image"), async (req, res) => {
  try {
    const { id, title, story, author } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    // Server-side word count validation
    let wordCount = story.split(/\s+/).filter((word) => word.length > 0).length;
    if (wordCount < 20) {
      return res.status(400).send("Story must be at least 20 words.");
    }
    if (wordCount > 70) {
      return res.status(400).send("Story must be no more than 70 words.");
    }

    const newStory = {
      id,
      title,
      author: author || "Anonymous",
      story,
      image: imagePath,
      ownerId: new ObjectId(req.session.userID), // internal ownership tracking
    };

    const result = await storiesCollection.insertOne(newStory);
    console.log("Story saved to database:", result);
    res.status(200).send("Story created.");
  } catch (err) {
    console.error(" Error saving story:", err);
    res.status(500).send("Error saving story.");
  }
});

app.get("/api/my-stories", async (req, res) => {
  if (!req.session || !req.session.username) {
    return res.status(401).json({ error: "Unauthorized" }); // Send JSON
  }
  try {
    const ownerId = new ObjectId(req.session.userID);
    const stories = await storiesCollection
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(stories);
  } catch (error) {
    console.error("Error fetching user's stories:", error);
    res.status(500).json({ error: "Server error fetching user's stories" }); // Send JSON
  }
});

app.put("/api/stories/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, story } = req.body;
    const { id } = req.params;

    // Validate word count
    let wordCount = story.split(/\s+/).filter((word) => word.length > 0).length;
    if (wordCount < 20 || wordCount > 70) {
      return res.status(400).send("Story must be between 20 and 70 words.");
    }

    const updateFields = {
      title: title,
      story: story,
    };

    if (req.file) {
      updateFields.image = `uploads/${req.file.filename}`;
    }

    const result = await storiesCollection.updateOne(
      { _id: new ObjectId(id), ownerId: new ObjectId(req.session.userID) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 1) {
      res.status(200).send("Story updated.");
    } else {
      res.status(404).send("Story not found.");
    }
  } catch (err) {
    console.error("Error updating story:", err);
    res.status(500).send("Internal server error.");
  }
});

// Added DELETE route for removing a story by ID from the database
app.delete("/api/stories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("DELETE route hit with ID:", id);

    const result = await storiesCollection.deleteOne({
      _id: new ObjectId(id),
      ownerId: new ObjectId(req.session.userID),
    });

    if (result.deletedCount === 1) {
      res.status(200).send("Story deleted.");
    } else {
      res.status(404).send("Story not found.");
    }
  } catch (err) {
    console.error("Error deleting story:", err);
    res.status(500).send("Internal server error.");
  }
});

// Route to serve the 'postStory' page
app.get("/postStory", function (req, res) {
  res.render("postStory");
});

// Route to serve the 'detailStory' page
app.get("/detailStory", function (req, res) {
  res.render("detailStory");
});

// Route to serve the 'myStories' page (only accessible to authenticated users)
app.get("/myStories", function (req, res) {
  // Redirect to login if user is not authenticated
  if (!req.session.authenticated) {
    return res.redirect("/login");
  }

  // Render the 'myStories.ejs' page from the views folder
  res.render("myStories", {}, function (err, html) {
    if (err) {
      console.error("Error rendering myStories.ejs from views:", err);
      res
        .status(500)
        .send(`Error rendering myStories.ejs. Server details: ${err.message}`);
    } else {
      res.send(html);
    }
  });
});

app.get("/layers", (req, res) => {
  let doc = fs.readFileSync("./app/html/layers.html", "utf8");
  res.send(doc);
});

//renders the errors page
app.get("/errors", (req, res) => {
  let message = req.query.message;
  if (message) {
    res.render("errors", { message: message });
  } else {
    res.render("errors", { message: "" });
  }

});

//renders the 404 page not found for all invalid routes
app.use(function (req, res) {
  res.status(404);
  res.render("404", { message: "Oops, this page doesn't exist." });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
