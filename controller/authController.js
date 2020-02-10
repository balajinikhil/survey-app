const jwt = require("jsonwebtoken");
const util = require("util");
const User = require("./../model/userModel");
const catchAsyn = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const createjwt = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports.signup = catchAsyn(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = await createjwt(newUser._id);

  res.status(201).json({
    status: "sucess",
    user: newUser,
    token
  });
});

module.exports.signin = catchAsyn(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  //check for email and password
  if (!email || !password) {
    return next(new AppError("please enter email and password", 401));
  }

  //check for user in db
  const checkUser = await User.findOne({ email: email }).select("+password");

  if (
    !checkUser ||
    !(await checkUser.checkPassword(password, checkUser.password))
  ) {
    return next(new AppError("email or password is incorrect ", 401));
  }

  const token = createjwt(checkUser._id);

  res.status(201).json({
    status: "sucess",
    checkUser,
    token
  });
});

exports.controller = catchAsyn(async (req, res, next) => {
  let token;
  //check for token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("login to continue", 401));
  }

  //verify token
  const utilPromise = util.promisify(jwt.verify);
  const decode = await utilPromise(token, process.env.JWT_SECRET);

  //verify user
  const verifyUser = await User.findOne({ _id: decode.id });

  if (!verifyUser) {
    return next(new AppError("User dosenot exists anymore", 401));
  }

  //check if password is changed
  if (verifyUser.changePasswordCheck(decode.iat)) {
    next(new AppError("Login with your new password", 401));
  }

  next();
});
