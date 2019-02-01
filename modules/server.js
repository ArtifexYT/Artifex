const http = require("http");
const express = require("express");
const app = express();

app.get("/", (request, response) => {
    console.log(`[${Date.now().toLocaleString("en-us")}] Server has responded with the status code of 200.`);
    response.sendStatus(200);
});

app.listen(process.env.PORT);

setInterval(() => {
    http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`); // HTTP module doesn't support HTTPS requests.
}, 10000);