const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const documentRoutes=require("./routes/documentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const trustedProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS, 10);
app.set(
  "trust proxy",
  Number.isInteger(trustedProxyHops) && trustedProxyHops > 0 ? trustedProxyHops : false
);

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {

    res.send("PrepGenius Backend Running");

});


app.use("/api/documents",documentRoutes);


app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;
