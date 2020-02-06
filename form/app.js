var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var app = express();

var sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database("friendknower.sqlite", (err) => {
    if (err) {
        console.log("Cannot connect to the database.");
    } else {
        console.log("Connection established with the database.");
    }
});

app.set('view engine', 'pug');
app.set('views', './views');

// for parsing application/json
app.use(bodyParser.json());

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true }));
// form - urlencoded

// for parsing multipart/form-data
app.use(upload.array());
app.use(express.static('public'));

app.all("/about", function (req, res) {
    res.render("about");
});

app.all("/policy", function (req, res) {
    res.render("policy");
});

// /preview?sender_id=12345&form_id=54321
app.get("/preview/:formId", function (req, res) {
    var form = {};

    let formId = req.params.formId;
    let formQuery = "SELECT * FROM Forms WHERE Id =?";
    let questionsQuery = "SELECT * FROM Questions WHERE FormId =?";

    db.serialize(function () {
        db.each(formQuery, [formId], (err, retrievedForm) => {
            if (err) {
                console.log("Cannot read from the table Forms");
                console.log(err);
                res.render("error");
            } else {
                if (retrievedForm) {
                    form.Id = formId;
                    form.userName = retrievedForm.Name;

                    // Read the form
                    db.all(questionsQuery, [formId], (err, retrievedQuestions) => {
                        if (err) {
                            console.log("Cannot read the Questions table.");
                            console.log(err);
                            res.render("error");
                        } else {
                            var questions = [];

                            retrievedQuestions.forEach((selectedQuestion) => {
                                // Statement, Option1, Option2, Option3, Option4, SelectedOption
                                var question = {};
                                question.id = selectedQuestion.Id;
                                question.statement = selectedQuestion.Statement;
                                question.option1 = selectedQuestion.Option1;
                                question.option2 = selectedQuestion.Option2;
                                question.option3 = selectedQuestion.Option3;
                                question.option4 = selectedQuestion.Option4;
                                question.selected = selectedQuestion.Selected;

                                questions.push(question);
                            });
                            form.questions = questions;
                            res.render("preview", form);
                        }
                    });
                } else {
                    console.log("Form not found");
                    res.render("lost");
                }
            }
        });
    });
});

app.post("/preview/:formId", function (req, res) {
    // Save the solution
    var id = req.body.formId;

    if (id) {
        var submissionBy = req.body.responseBy;
        var answers = [];

        for (var i = 1; i <= 10; i++) {
            var selection = req.body["question" + i];

            var parts = selection.split(',');
            var answer = {
                questionId: parts[0],
                selection: parts[1]
            };

            answers.push(answer);
        }

        db.run("INSERT INTO Solutions (FormId, SubmissionBy, Answers) VALUES ($formId, $submissionBy, $answers)", {
            $formId: id,
            $submissionBy: submissionBy,
            $answers: JSON.stringify(answers)
        }, function (err) {
            if (err) {
                console.log("Cannot save the solution");
                console.log(err);
                res.render("error");
            } else {
                console.log("Response saved");
                res.redirect("/stats/" + id);
            }
        });
    } else {
        res.send(404);
    }
});

app.get("/stats/:formId", function (req, res) {
    // Load the stats
    var formId = req.params.formId;

    db.each("SELECT * FROM Forms WHERE Id =?", [formId], function (err, form) {
        if (err) {
            console.log("Cannot read from Forms table.");
            console.log(err);
            res.redirect("/error");
        } else {
            db.all("SELECT * FROM Questions WHERE FormId =?", [formId], function (err, retrievedQuestions) {
                if (err) {
                    console.log("Cannot read from Questions table");
                    console.log(err);
                    res.redirect("/error");
                } else {
                    // Read the questions
                    var total = 10;
                    var questions = [];
                    for (var i = 0; i < total; i++) {
                        var obj = {
                            id: retrievedQuestions[i].Id,
                            selected: retrievedQuestions[i].SelectedOption
                        };

                        questions.push(obj);
                    }
                    
                    var solutions = [];
                    db.all("SELECT * FROM Solutions WHERE FormId =?", [formId], function (err, retrievedSolutions) {
                        if (retrievedSolutions.length == 0) {
                            res.render("stats", { notSolved: true, formId: formId });
                        } else {
                            for (var s = 0; s < retrievedSolutions.length; s++) {
                                // Check correct answers
                                var correctAnswers = 0;
                                var answers = JSON.parse(retrievedSolutions[s].Answers);
                                for (a in answers) {
                                    var answer = answers[a];
                                    var q = questions.find(_ => _.id == answer.questionId);

                                    if (q) {
                                        if (q.selected == answer.selection) {
                                            correctAnswers++;
                                        }
                                    }
                                }

                                var solTemplate = {
                                    by: retrievedSolutions[s].SubmissionBy,
                                    corrects: correctAnswers
                                };

                                solutions.push(solTemplate);
                            }
                            
                            // Render the stats
                            res.render("stats", { solutions: solutions, formId: formId });
                        }
                    });
                }
            });
        }
    }, function (err, forms) {
        // Not found perhaps.
    });
});

app.get("/create", function (req, res) {
    res.render("create");
});

app.get("/error", function (req, res) {
    res.render("error");
});

app.get("/lost", function (req, res) {
    res.render("lost");
});

let publicUser = 12345;
var formId = 0;
app.post("/create", async function (req, res) {

    var questionsCount = req.body["questions"];

    // form
    var form = {
        id: null
    };

    db.run("INSERT INTO Forms (UserId, Name) VALUES($userid, $username)", {
        $userid: publicUser,
        $username: req.body.username
    }, await function (err) {
        formId = this.lastID;

        // questions
        var questions = [];
        for (var i = 1; i <= questionsCount; i++) {
            questions[i] = {
                statement: req.body["question" + i],
                formId: this.lastID
            };

            if (!questions[i].statement.endsWith("?")) { questions[i].statement += "?"; }

            // answers
            var answers = [];
            questions[i].selected = req.body["question" + i + "selected"];
            for (var a = 1; a <= 4; a++) {
                var answer = {
                    statement: req.body["question" + i + "option" + a]
                };
                
                answers[a - 1] = answer;
            }
            questions[i].answers = answers;
        }
        questions.forEach(function (question) {
            db.run("INSERT INTO Questions (FormId, Statement, Option1, Option2, Option3, Option4, SelectedOption) VALUES ($formid, $statement, $op1, $op2, $op3, $op4, $selected)", {
                $statement: question.statement,
                $formid: question.formId,
                $op1: question.answers[0].statement,
                $op2: question.answers[1].statement,
                $op3: question.answers[2].statement,
                $op4: question.answers[3].statement,
                $selected: question.selected,
            }, function (err) {
                if (!err) {
                    question.id = this.lastId;
                    console.log("A question was insterted with the ID " + this.lastID);
                }
            });
        });

        res.redirect("/formcreated/" + this.lastID);
    });
    
    console.log(JSON.stringify(req.body));
    // res.render("formcreated", { formId: formId });
});

app.get("/formcreated/:formId", function (req, res) {
    res.render("formcreated", { formId: req.params.formId });
});

app.get("/", function (req, res) {
    res.render("index");
});

app.get("*", function (req, res) {
    res.redirect("lost");
});

app.get("/lost", function (req, res) {
    res.render("lost");
});

let removeTables = false;
function setupDb() {
    if (removeTables) {
        db.run("DROP TABLE IF EXISTS Users");
        db.run("DROP TABLE IF EXISTS Forms");
        db.run("DROP TABLE IF EXISTS Questions");
        db.run("DROP TABLE IF EXISTS Solutions");
    }

    db.run("CREATE TABLE IF NOT EXISTS Users (Id INTEGER PRIMARY KEY, Name TEXT, Token TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS Forms (Id INTEGER PRIMARY KEY, UserId INTEGER, Name TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS Questions (Id INTEGER PRIMARY KEY, FormId INTEGER, Statement TEXT, Option1 TEXT, Option2 TEXT, Option3 TEXT, Option4 TEXT, SelectedOption TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS Solutions (Id INTEGER PRIMARY KEY, FormId INTEGER, Answers TEXT, SubmissionBy TEXT)");
}

let port = 2000;
let dev = true;
app.listen(process.env.PORT || 8080, function () {
    setupDb();

    console.log("Server is listening at localhost:" + port);
});
