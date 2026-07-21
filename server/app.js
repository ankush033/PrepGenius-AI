const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const documentRoutes=require("./routes/documentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {

    res.send("PrepGenius Backend Running");

});


app.use("/api/documents",documentRoutes);


app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;