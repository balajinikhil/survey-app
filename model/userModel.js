const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  userData: [Object],
  password: {
    type: String,
    select: false,
    maxlength: 8
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: "Password is not matching"
    }
  },
  passwordCreatedAt: {
    type: Date,
    default: Date.now()
  }
});

userSchema.pre("save", async function(next) {
  this.password = await bcrypt.hash(this.password, 10);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.checkPassword = function(newUser, user) {
  return bcrypt.compare(newUser, user);
};

userSchema.methods.changePasswordCheck = function(jwttime) {
  if (this.passwordCreatedAt) {
    const usertimeStamp = parseInt(
      //conversion of time
      this.passwordCreatedAt.getTime() / 1000,
      10
    );

    return jwttime < usertimeStamp;
  }

  return false;
};

const User = mongoose.model("Users", userSchema);

module.exports = User;
