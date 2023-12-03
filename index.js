const express = require('express');

const app = express();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server Running on Port *${PORT}.`);
})

app.get("/", (req, res) => {
    res.send("Hello GCP");
})

app.get("/test", (req, res) => {
    res.send("Hello2");
})
