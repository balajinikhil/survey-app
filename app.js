const express = require("express");
const morgan = require("morgan");
const questionsRouter = require("./routes/questionRouter");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/errorController");
const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(`${__dirname}/public`));

app.use("/quiz", (req, res) => {
  res.status(200).sendFile(`${__dirname}/public/index.html`);
});

app.use("/api/v1/questions", questionsRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
