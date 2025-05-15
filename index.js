require('dotenv').config();
const express = require('express');

const fs = require('fs');
const session = require('express-session');

const path = require('path');
const MongoStore = require('connect-mongo');
const { ObjectId } = require('mongodb');

const port = process.env.PORT || 3000;

const bcrypt = require('bcrypt');

const saltRounds = 12;

const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

const Joi = require("joi");



const app = express();

app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));
app.use("/text", express.static("./public/text"));
app.use("/font", express.static("./public/font"));
app.use("/html", express.static("./app/html"));
app.use("/snippets", express.static("./public/snippets"));
app.use("/uploads", express.static("./uploads"));

app.set('view engine', 'ejs');

//mongodb variables
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

let { database } = require('./databaseConnection.js');
const { error } = require('console');

const userCollection = database.db(mongodb_database).collection('users');
const storiesCollection = database.db(mongodb_database).collection('stories');
const alertLocationsCollection = database.db(mongodb_database).collection('alertLocations');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// this is the session middleware, that will create a session for the user
var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    resave: true,
    saveUninitialized: false,
}));


// this is the home page of the
app.get("/", function (req, res) {
    res.render("index");
});

app.get("/main", function (req, res) {
    res.render("main");
});

// this is the login page
app.get("/login", function (req, res) {
    if (! req.session.authenticated) {
        res.render("login");
    } else {
        if (app.locals.loggedIn == false) {
            app.locals.loggedIn = true;
        }
        res.redirect("/main");
    }
});
// this will submit the login data to the database to check if the user exists
app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    let details = [];

    const schema = Joi.string().max(20).required().label("username");
    const validationResult = schema.validate(username);
    if (validationResult.error != null) {
        details.push(validationResult.error["details"][0].message);
        res.render("login", {error: details, username: username, password: password});
        return;
    }

    const result = await userCollection.findOne({ username: username }, { projection: { username: 1, password: 1, _id: 1 } });

    console.log(result);
    if (!result) {
        details.push("Username not found");
        res.render("login", { error: details, input: { username: username, password: password }});
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
    }
    else {
        if (password.length > 0) {
            details.push("Incorrect password");
        } else {
            details.push("Empty password");
        }
        res.render("login", { error: details, input: { username: username, password: password } });
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
    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    let details = [];
    const schema = Joi.object(
        {
            name: Joi.string().alphanum().max(20).required(),
            username: Joi.string().alphanum().max(20).required(),
            email: Joi.string().max(20).email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
            password: Joi.string().min(8).max(20).required()
        });

    const validationResult = schema.validate({ name, username, email, password }, { abortEarly: false });
    if (validationResult.error != null) {
        for (let detail of validationResult.error["details"]) {
            details.push(detail.message);
        }
    }
    // will check if the username or email already exists in the database
    const existingUser = await userCollection.findOne({  username: username });
    const existingEmail = await userCollection.findOne({ email: email });
    if (existingUser && username.length > 0 ) {
        details.push("Username already in use");
    }
    if (existingEmail && email.length > 0 ) {
        details.push("Email already in use");
    }
    if (details.length > 0) {
        res.render("signup", { error: details, input: {name: name, email: email, username: username, password: password} });
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
        savedLocation: []
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
            console.error("Error during logout: ", err);
            res.status(500).send("Internal Server Error");
        } else {
            app.locals.loggedIn = false;
            res.redirect("/");
        }
    });
});

//


//for updating user's current search location
app.post("/recordCurrentLocation", async function (req, res) {
    if (req.session.authenticated) {
        try {
            const { currentLocation } = req.body; // Get data from the client

            await userCollection.updateOne(
                { _id: new ObjectId(req.session.userID) },
                {
                    $set: { 'currentSearchLocation': currentLocation },
                    $currentDate: { lastModified: true }
                });
            res.status(201).send('Location saved successfully');
        } catch (error) {
            console.error('Error saving user location:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.send("User not logged in");
    }

})


//saves currentSearchLocation into savedLocation array
app.post("/saveLocation", async function (req, res) {
    let { alert } = req.body;
    if (req.session.authenticated) {
        try {
            let userID = new ObjectId(req.session.userID);
            const result = await userCollection.findOne(
                { _id: userID }, { projection: { currentSearchLocation: 1 } }
            );
            let savedLocation = { location: result.currentSearchLocation, alert: alert }
            await userCollection.updateOne(
                { _id: userID }, { $push: { savedLocation } }
            )
            if (alert) {
                const alertResult = await alertLocationsCollection.findOne({ location: result.currentSearchLocation },
                    { projection: { _id: 1 } }
                );
                if (alertResult && alertResult.hasOwnProperty("_id")) {
                    await alertLocationsCollection.updateOne(
                        { _id: new ObjectId(alertResult._id) }, { $push: { users: userID } }
                    )
                } else {
                    let alertLocation = {
                        location: result.currentSearchLocation,
                        users: [userID]
                    }
                    await alertLocationsCollection.insertOne(alertLocation);
                }
            }
            res.status(201).send('Location saved');
        } catch (error) {
            res.status(500).send('Error saving location');
        }

    } else {
        res.send("User not logged in")
    }
});

//sends user's current search location as a json with coordinate and name properities
app.get('/getCurrentSearchLocation', async function (req, res) {
    if (req.session.authenticated) {
        try {
            let userID = new ObjectId(req.session.userID);
            let data = null;
            const result = await userCollection.findOne(
                { _id: userID }, { projection: { currentSearchLocation: 1 } }
            );
            if (result.currentSearchLocation) {
                data = {
                    coordinate: result.currentSearchLocation.geometry.coordinates,
                    address: result.currentSearchLocation.properties.full_address
                }
            }
            res.send(data);

        } catch (error) {
            res.status(500).send('Unable to save location');
        }

    } else {
        res.send("User not logged in")
    }
});

//middleware to store if current search location is already in saved location
async function locationSaved(req, res, next) {
    let isSaved = "false";
    if (req.session.authenticated) {
        let userID = new ObjectId(req.session.userID);
        const result = await userCollection.findOne(
            { _id: userID }, { projection: { savedLocation: 1, currentSearchLocation: 1 } }
        );

        if (result.currentSearchLocation) {
            let currentLocationProperties = result.currentSearchLocation.properties;
            let currentAddress = currentLocationProperties.full_address;
            let locationArray = result.savedLocation;

            locationArray.forEach(saved => {
                let address = saved.location.properties.full_address;
                if (address === currentAddress) {
                    isSaved = "true";
                }
            });
        }
    };
    req.session.isLocationSaved = isSaved;
    next();
}

//checks if currently searched location is already saved in database
app.get("/checkLocationSaved", locationSaved, function (req, res) {
    res.send(req.session.isLocationSaved);
    return;
});

//sends popup on main page based on if user is logged in, or if location has previously been saved
app.get("/popup", locationSaved, (req, res) => {
    if (req.session.isLocationSaved == "true") {
        res.render("main/savedPopup");
    } else if (req.session.authenticated) {
        res.render("main/alertPopup");
    } else {
        res.render("main/loginPopup");
    }
});

app.get("/deletePopup", (req, res) => {
    try {
        res.render("savedLocations/deletePopup");
    } catch (error) {
        console.error("Error rendering EJS template:", error);
        res.status(500).send("Error rendering template.");
    }
})

//display list of saved locations
app.get("/displaySavedLocations", async (req, res) => {
    let userID = new ObjectId(req.session.userID);
    try {
        let result = await userCollection.findOne({ username: req.session.username }, { projection: { savedLocation: 1 } })
        let locationArray = result.savedLocation;
        //console.log(result);
        if (locationArray.length == 0) {
            res.render("savedLocations/location", { locationArray: [], message: "No Saved Locations" });
        } else {
            res.render("savedLocations/location", { locationArray: locationArray, message: "" });
        }
    } catch (error) {
        console.error("Error displaying saved location: ", error);
    }
});

//deletes saved location from the database
app.post("/deleteLocation", async (req, res) => {
    let { locationId, alertOn } = req.body;
    let userID = new ObjectId(req.session.userID);
    try {
        //remove location from saved location
        let result = await userCollection.findOne({ _id: userID }, { projection: { savedLocation: 1 } })
        await userCollection.updateOne(
            { _id: userID },
            { $pull: { savedLocation: { "location.id": locationId } } }
        )
        if (alertOn) {
            //removes location/user from alert locations
            const alertResult = await alertLocationsCollection.findOne({ "location.id": locationId },
                { projection: { _id: 1, users: 1 } }
            );

            if (alertResult && alertResult.hasOwnProperty("_id") && alertResult.users.length > 1) {
                let docID = new ObjectId(alertResult._id);
                await alertLocationsCollection.updateOne(
                    { _id: docID }, { $pull: { users: userID } }
                )
                res.status(200).send("User removed from alert location");
            } else if (alertResult && alertResult.hasOwnProperty("_id")) {
                let docID = new ObjectId(alertResult._id);
                await alertLocationsCollection.deleteOne({ _id: docID });
                res.status(200).send("Alert location deleted");
            } else {
                res.status(200).send("Location not in alertLocation")
            }
        } else {
            res.status(200).send("Location deleted from savedLocation")
        }
    } catch (error) {
        res.status(500).send("Error deleting saved location: " + error)
    }

})

app.post("/updateAlert", async (req, res) => {
    let { locationId, newAlert } = req.body;
    let userID = new ObjectId(req.session.userID);
    try {
        //updates alerts in savedLocations
        await userCollection.updateOne(
            { _id: userID, savedLocation: { $elemMatch: { "location.id": locationId } } },
            { $set: { "savedLocation.$.alert": newAlert } }
        )

        //updates alerts in alertsLocation
        let locationResult = await userCollection.findOne(
            { _id: userID, savedLocation: { $elemMatch: { "location.id": locationId } } },
            { projection: { "savedLocation.$": 1 } }
        )
        //geojson object of location
        let location = locationResult.savedLocation[0].location;

        const alertResult = await alertLocationsCollection.findOne({ "location.id": locationId },
            { projection: { _id: 1, users: 1 } }
        );

        if (newAlert) {
            if (alertResult && alertResult.hasOwnProperty("_id")) {
                let docID = new ObjectId(alertResult._id);
                await alertLocationsCollection.updateOne(
                    { _id: docID }, { $push: { users: userID } }
                )
            } else {
                let alertLocation = {
                    location: location,
                    users: [userID]
                }
                await alertLocationsCollection.insertOne(alertLocation);
            }
            res.status(200).send("alert location updated");
        } else {
            if (alertResult && alertResult.hasOwnProperty("_id") && alertResult.users.length > 1) {
                let docID = new ObjectId(alertResult._id);
                await alertLocationsCollection.updateOne(
                    { _id: docID }, { $pull: { users: userID } }
                )
                res.status(200).send("alert location updated");
            } else if (alertResult && alertResult.hasOwnProperty("_id")) {
                let docID = new ObjectId(alertResult._id);
                await alertLocationsCollection.deleteOne({ _id: docID });
                res.status(200).send("alert location updated");
            } else {
                res.status(500).send("error updating alertLocation database")
            }
        }
    } catch (error) {
        res.status(500).send("error updating savedLocations alert: " + error)
    }
})

//this is the profile page, used to display the user profile information
app.get("/profile", async function (req, res) {
    if (req.session.authenticated) {
        let result = await userCollection.findOne({ username: req.session.username }, { projection: { name: 1, email: 1} })
        res.render("profile", {name: result.name, email: result.email});
    } else {
        res.redirect("/main");
    }
    
});

app.post("/profileUpdate", async function (req, res) {
    if (req.session.authenticated) {
        res.setHeader("Content-Type", "application/json");
        let name = req.body.name;
        let email = req.body.email;
        await userCollection.updateOne(
            { username: req.session.username },
            {
                $set: { 'name': name, 'email': email },
            });
    } else {
        res.redirect("/main");
    }
})

//for floodAdaptation.html
app.get("/floodAdaptation", function (req, res) {
    let doc = fs.readFileSync("./app/html/floodAdaptation.html", "utf8");
    res.send(doc);
});

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


//for heatAdaptation.html
app.get("/heatAdaptation", function (req, res) {
    let doc = fs.readFileSync("./app/html/heatAdaptation.html", "utf8");
    res.send(doc);
});

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

app.get('/mapboxToken', function (req, res) {
    res.send({ token: process.env.MAPBOX_ACCESS_TOKEN });
});

app.get('/mapboxTokenLayer', (req, res) => {
    res.send({ token: process.env.TOKENAPI })
});


//
app.get("/stories", function (req, res) {
    res.render("stories");
});

//
app.get("/savedLocation", function (req, res) {
    res.render("savedLocation");
});

app.get("/authenticated", function (req, res) {
    if (req.session.authenticated) {
        res.send('true');
    } else {
        res.send('false');
    }
})

app.get("/sessionInfo", (req, res) => {
    if (req.session.authenticated) {
        res.json({
            username: req.session.username,
            userID: req.session.userID
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
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // You can customize storage options if needed

app.post("/api/stories", upload.single("image"), async (req, res) => {
    try {

        const { id, title, story } = req.body;
        const author = req.session.username;
        const imagePath = req.file ? `uploads/${req.file.filename}` : null;

        // Server-side word count validation
        let wordCount = story.split(/\s+/).filter(word => word.length > 0).length;
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
            image: imagePath
        };

        const result = await storiesCollection.insertOne(newStory);
        console.log("Story saved to database:", result);
        res.status(200).send("Story created.");
    } catch (err) {
        console.error(" Error saving story:", err);
        res.status(500).send("Error saving story.");
    }
});

app.put("/api/stories/:id", upload.single("image"), async (req, res) => {
    try {
      const { title, story } = req.body;
      const { id } = req.params;
  
      // Validate word count
      let wordCount = story.split(/\s+/).filter(word => word.length > 0).length;
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
        { _id: new ObjectId(id) },
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
  
      const result = await storiesCollection.deleteOne({ _id: new ObjectId(id) });
  
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

app.get("/detailStory", function (req, res) {
    res.render("detailStory");
});

app.get('/layers', (req, res) => {
    let doc = fs.readFileSync("./app/html/layers.html", "utf8");
    res.send(doc);
});

app.use(function (req, res) {
    res.status(404);
    res.render("404");
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});