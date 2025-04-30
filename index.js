
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
app.use("/img", express.static("./public/img"));
app.use("/font", express.static("./public/font"));
app.use("/html", express.static("./app/html"));
app.use("/snippets", express.static("./public/snippets"));

//mongodb variables
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

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
    secret: node_session_secret,
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

app.get("/profile", function(req, res) {
    let doc = fs.readFileSync("./app/html/profile.html", "utf8");
    res.send(doc);
}
);



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});