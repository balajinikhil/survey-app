const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  userData: [Object]
});

const User = mongoose.model("Users", userSchema);

module.exports = User;
