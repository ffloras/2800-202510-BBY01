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

// this is the login page
app.get("/login", function (req, res) {
    res.render("login");
});
// this will submit the login data to the database to check if the user exists
app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const schema = Joi.string().max(20).required();
    const validationResult = schema.validate(username);
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect("/login");
        return;
    }

    const result = await userCollection.findOne({ username: username }, { projection: { username: 1, password: 1, _id: 1 } });

    console.log(result);
    if (!result) {
        res.redirect("/login");
        return;
    }
    if (await bcrypt.compare(password, result.password)) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.cookie.maxAge = expireTime;
        req.session.userID = result._id;
        app.locals.loggedIn = true;
        res.redirect("/main"); //****change this to something else after user is logged in 
        return;
    }
    else {
        console.log("incorrect password");
        res.redirect("/login");
        return;
    }
});

// this is the signup page
app.get("/signup", function (req, res) {
    res.render("signup");
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
    };

    await userCollection.insertOne(user);
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
            res.redirect("/login");
        }
    });
});

//
app.get("/main", function (req, res) {
    res.render("main");
});

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
app.get("/saveLocation", async function (req, res) {
    if (req.session.authenticated) {
        try {
            let userID = new ObjectId(req.session.userID);
            const result = await userCollection.findOne(
                { _id: userID }, { projection: { currentSearchLocation: 1 } }
            );
            let savedLocation = { location: result.currentSearchLocation, alert: false }
            await userCollection.updateOne(
                { _id: userID }, { $push: { savedLocation } }
            )
            res.status(201).send('Location saved');
        } catch (error) {
            res.status(500).send('Unable to save location');
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
            const result = await userCollection.findOne(
                { _id: userID }, { projection: { currentSearchLocation: 1 } }
            );
            let data = {
                coordinate: result.currentSearchLocation.geometry.coordinates, 
                address: result.currentSearchLocation.properties.full_address}
            res.send(data);

        } catch (error) {
            res.status(500).send('Unable to save location');
        }

    } else {
        res.send("User not logged in")
    }
})

//checks if currently searched location is already saved in database
app.get("/checkLocationSaved", async function (req, res) {
    let isSaved = "false";
    if (req.session.authenticated) {
        let userID = new ObjectId(req.session.userID);
        const result = await userCollection.findOne(
            { _id: userID }, { projection: { savedLocation: 1, currentSearchLocation: 1 } }
        );

        let currentLocationProperties = result.currentSearchLocation.properties;
        let currentAddress = currentLocationProperties.full_address;

        if (result.savedLocation) {
            let locationArray = result.savedLocation;

            locationArray.forEach(saved => {
                //console.log(location);
                let address = saved.location.properties.full_address;
                if (address === currentAddress) {
                    isSaved = "true";
                }
            });
        }
    }
    res.send(isSaved);
    return;
})

//this is the profile page, used to display the user profile information
app.get("/profile", function (req, res) {
    res.render("profile");
});

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
    res.send({token : process.env.TOKENAPI})
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
// // Route to handle story submissions (POST request to /api/posts)
// // Accepts form data including an optional image upload
// // Saves the story data to the MongoDB collection
// app.post("/api/posts", upload.single("image"), async (req, res) => {
//     try {
//       const { id, title, author, story } = req.body;
//       const imagePath = req.file ? req.file.path : null;
  
//       const newStory = {
//         id,
//         title,
//         author: author || "Anonymous",
//         story,
//         image: imagePath
//       };
  
//       await postCollection.insertOne(newStory);
//       res.status(200).send("Story created.");
//     } catch (err) {
//       console.error(err);
//       res.status(500).send("Error saving story.");
//     }
//   });
  

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