const User = require("./../model/userModel");
const catchAsync = require("./../utils/catchAsync");

exports.sendData = catchAsync(async (req, res, next) => {
  const sent = await User.create(req.body);

  res.status(201).json({
    status: "sucess",
    sent
  });
});

exports.getData = catchAsync(async (req, res, next) => {
  const user = await User.find();

  res.status(200).json({
    status: "sucess",
    user
  });
});
