require('dotenv').config();
const express = require('express');

const fs = require('fs');
const session = require('express-session');

const path = require('path');
const MongoStore = require('connect-mongo');

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

app.set('view engine', 'ejs');

//mongodb variables
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

let { database } = require('./databaseConnection.js');

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
    let doc = fs.readFileSync("./app/html/index.html", "utf8");
    res.send(doc);
});
app.get("/landing", function(req, res) {
    let doc = fs.readFileSync("./app/html/landing.html", "utf8");
    res.send(doc);
});

// this is the login page
app.get("/login", function (req, res) {
    let doc = fs.readFileSync("./app/html/login.html", "utf8");
    res.send(doc);
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
    let doc = fs.readFileSync("./app/html/signup.html", "utf8");
    res.send(doc);
});

// this is the post request for the signup page, used to submit user data to the database
app.post("/signup", async (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    // used for username validation
    const schema = Joi.string().max(20).required();
    const validationResult = schema.validate(username);
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect("/signup");
        return;
    }

    // used for password validation
    const passwordSchema = Joi.string().min(8).max(30).required();
    const passwordValidation = passwordSchema.validate(password);
    if (passwordValidation.error != null) {
        console.log(passwordValidation.error);
        res.redirect("/signup");
        return;
    }

    // used for email validation
    const emailSchema = Joi.string().email().max(30).required();
    const emailValidation = emailSchema.validate(email);
    if (emailValidation.error != null) {
        console.log(emailValidation.error);
        res.redirect("/signup");
        return;
    }

    // will check if the username or email already exists in the database
    const existinguser = await userCollection.findOne({ $or: [{ username: username }, { email: email }] });
    if (existinguser) {
        console.log("User already exists");
        res.redirect("/signup?error=User already exists");
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
            res.redirect("/login");
        }
    });
});


app.get("/index", function (req, res) {
    let doc = fs.readFileSync("./app/html/index.html", "utf8");
    res.send(doc);
});

//
app.get("/main", function (req, res) {
    let doc = fs.readFileSync("./app/html/main.html", "utf8");
    res.send(doc);
});

//this is the profile page, used to display the user profile information
app.get("/profile", function(req, res) {
    let doc = fs.readFileSync("./app/html/profile.html", "utf8");
    res.send(doc);
});

//for floodAdaptation.html
app.get("/floodAdaptation", function(req, res) {
    let doc = fs.readFileSync("./app/html/floodAdaptation.html", "utf8");
    res.send(doc);
});

app.get("/flood/:content", function(req,res) {
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
app.get("/heatAdaptation", function(req, res) {
    let doc = fs.readFileSync("./app/html/heatAdaptation.html", "utf8");
    res.send(doc);
});

app.get("/heat/:content", function(req,res) {
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





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});