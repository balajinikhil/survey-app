const Router = require("express").Router();
const userController = require("./../controller/userController");

Router.route("/")
  .post(userController.sendData)
  .get(userController.getData);

module.exports = Router;
