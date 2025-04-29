const express = require('express');
const session = require('express-session');
const port = 3000;


const app = express();

app.use(express.static(__dirname, "/public"));






app.get("*", (req, res) => {
    res.status(404).send("Page not found");
    res.send("Page not found");
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});