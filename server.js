const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");

const app = require("./app");
const port = process.env.PORT || 7000;
const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log("DB connected");
  })
  .catch(() => {
    console.log("DB connection error");
  });

app.listen(port, () => {
  console.log(`up and running ${port}`);
});
