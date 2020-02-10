const Router = require("express").Router();
const userController = require("./../controller/userController");
const authController = require("./../controller/authController");

Router.post("/signup", authController.signup);
Router.post("/signin", authController.signin);

Router.route("/")
  .post(userController.sendData)
  .get(authController.controller, userController.getData);

module.exports = Router;
