
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const MongoStore = require('connect-mongo');
const port = 3000;

const app = express();

app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/imgs"));
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

let {database} = require('./databaseConnection.js');

const userCollection = database.db(mongodb_database).collection('users');

let mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(express.urlencoded({extended: false}));

app.use(session({
    secret: 'secret-key',
    store: mongoStore,
    resave: false,
    saveUninitialized: true,
}));


app.get("/", function(req, res) {
    let doc = fs.readFileSync("./app/html/index.html", "utf8");
    res.send(doc);
});

app.get("/login", function(req, res) {
    let doc = fs.readFileSync("./app/html/login.html", "utf8");
    res.send(doc);
});

app.get("/main", function(req, res) {
    let doc = fs.readFileSync("./app/html/main.html", "utf8");
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





app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});