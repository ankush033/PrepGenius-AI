const express = require("express");

const router = express.Router();
const rateLimit = require("../middleware/rateLimit");
const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const auth = require("../middleware/authMiddleware");

const {
    register,
    login,
} = require("../controllers/authController");

const { me } = require("../controllers/authController");

router.get("/me", auth, me);

router.post("/register", authRateLimit, register);

router.post("/login", authRateLimit, login);

module.exports = router;
