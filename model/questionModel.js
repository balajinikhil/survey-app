const mongoose = require("mongoose");

const questionsSchema = new mongoose.Schema({
  category: {
    type: String
  },
  type: {
    type: String
  },
  difficulty: {
    type: String,
    enum: {
      values: ["easy", "medium", "difficult"],
      message: "must be easy difficult or medium"
    }
  },
  question: {
    type: String,
    required: true,
    unique: true
  },
  correct_answer: { type: String, required: true },
  incorrect_answers: [String],
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

let Question = mongoose.model("questions", questionsSchema);

module.exports = Question;
