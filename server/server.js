require("dotenv").config();
const app = require("./app");


const connectDB = require("./config/db");
console.log("Gemini Key:", process.env.GEMINI_API_KEY?.substring(0, 10));
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server Running on ${PORT}`);

});