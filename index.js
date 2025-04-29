
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path');
const port = 3000;

const app = express();

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));


app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));
app.use("/font", express.static("./public/font"));
app.use("/html", express.static("./app/html"));


app.get("/", function(req, res) {
    let doc = fs.readFileSync("./app/html/index.html", "utf8");
    res.send(doc);
});

app.get("/login", function(req, res) {
    let doc = fs.readFileSync("./app/html/login.html", "utf8");
    res.send(doc);
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});