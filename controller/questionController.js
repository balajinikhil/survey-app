const Question = require("./../model/questionModel");
const catchAsync = require("./../utils/catchAsync");

exports.getQuestions = catchAsync(async (req, res) => {
  const question = await Question.find().sort("-createdAt");

  res.status(200).json({
    status: "sucess",
    results: question
  });
});

exports.addQuestions = catchAsync(async (req, res) => {
  const newQues = await Question.create(req.body);

  res.status(200).json({
    status: "sucess",
    newQues
  });
});

exports.deleteQuestion = catchAsync(async (req, res, next) => {
  const del = await Question.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: "sucess",
    question: null
  });
});
