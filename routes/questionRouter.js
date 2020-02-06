const Router = require("express").Router();
const questionController = require("./../controller/questionController");

Router.route("/")
  .get(questionController.getQuestions)
  .post(questionController.addQuestions);

Router.route("/:id").delete(questionController.deleteQuestion);
module.exports = Router;
