let express = require("express");
let app = express();
// app.listen(5500, "127.0.0.3", function () {
//   console.log("Zone express server started @ 127.0.0.3:5500")
// })
app.listen(process.env.PORT, function () {
  console.log("Zone express server started @ 127.0.0.3:5500");
});
let dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
let morgan = require("morgan");
app.use(morgan("dev"));

let cors = require("cors");
app.use(
  cors({
    methods: ["GET", "POST", "PUT", "PATCH"],
    credentials: true,
    origin: "*",
  })
);

let helmet = require("helmet");
app.use(helmet());

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

const emails = require("./emailer.js");
const html = require("./html.js");

let bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");
let mongoose = require("mongoose");

mongoose
  .connect(process.env.mongodb, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(function () {
    console.log("Zone DB connected");
  })
  .catch(function () {
    console.log(process.env.mongodb);
    console.log("Zone DB connection error");
  });

app.use(express.json());
app.use(express.static("./public"));

let { dbUsers, dbSockets, dbTweets } = require("./schemas.js");

let errorResponce = function (responceObj, message, err) {
  responceObj
    .status(404)
    .header({
      "content-type": "application/json",
    })
    .send({
      status: message || "Error",
      error: err || "Error",
    });
};

//hash password
app.use(function (req, res, next) {
  if (req.body.password) {
    bcrypt
      .hash(req.body.password, 12)
      .then(function (pass) {
        req.body.password = pass;
        next();
      })
      .catch(function () {
        errorResponce(res, "Internal Server Error");
      });
  } else {
    next();
  }
});

//confirm key
app.param("key", function (req, res, next) {
  if (req.params.key !== "1680") return errorResponce(res, "Authentication Failed");
  else {
    next();
  }
});

let currUserEmail;
//verify token
app.param("token", function (req, res, next) {
  jwt.verify(req.params.token, process.env.jwtkey, function (err, obj) {
    if (err) return errorResponce(res, "T Authentication Failed");
    currUserEmail = obj.email;
    next();
  });
});

//Signup

app.post("/signup/:key", function (req, res) {
  if (!req.body) return errorResponce(res, "Internal Server Error");
  dbUsers
    .create(req.body)
    .then(function (data) {
      dbSockets
        .create({
          socketId: "",
          name: req.body.name,
          username: req.body.username,
          online: false,
        })
        .then(function () {
          res
            .status(200)
            .header({
              "content-type": "application/json",
            })
            .send({
              status: "User Created",
            });

          let options = {
            from: "zone@gmail.com",
            to: req.body.email,
            subject: "Welcome to Zone!",
            html: emails.emitEmailHtml(
              "Thank you for signing up to Zone. You can now login to start connecting with your friends and loved ones. <br> Get in your zone!"
            ),
          };

          emails.emailer(options);
        })
        .catch(function (err) {
          errorResponce(res, err.message);
        });
    })
    .catch(function (err) {
      errorResponce(res, err.message);
    });
});

//Login to get token

app.get("/login/:key/:username/:password", function (req, res) {
  let username = req.params.username;
  let password = req.params.password;

  let startFinding = dbUsers.findOne({ username: username }).select("+password");

  startFinding.then(function (data) {
    if (!data) return errorResponce(res, "Username or Password Incorrect");

    bcrypt.compare(password, data.password).then(function (verify) {
      if (!verify) return errorResponce(res, "Username or Password Incorrect");

      const token = jwt.sign({ username: req.params.username }, process.env.jwtkey, {
        expiresIn: "24h",
      });

      res
        .status(200)
        .header({
          "content-type": "application/json",
        })
        .send({
          status: "User Verified",
          username: username,
          token: token,
        });
    });
  });
});

//User Routes

app.route("/users/:key/:token/:username?").get(function (req, res) {
  if (req.params.username) {
    let startFinding = dbUsers
      .findOne({ username: req.params.username })
      .populate("tweets retweets likedTweets")
      .populate({
        path: "following",
        select: "_id username name photo",
      })
      .populate({
        path: "followers",
        select: "_id username name photo",
      })
      .populate({
        path: "blockedList",
        select: "_id username name photo",
      })
      .populate("conversations");

    startFinding
      .then(function (data) {
        if (!data) return errorResponce(res, "User does not exist");

        res
          .status(200)
          .header({
            "content-type": "application/json",
          })
          .send({
            status: "Found One Users",
            data: data,
          });
      })
      .catch(function (err) {
        errorResponce(res, "internal server error");
      });
  } else if (req.query.id) {
    let startFinding = dbUsers
      .findById(req.query.id)
      .populate("tweets retweets likedTweets")
      .populate({
        path: "following",
        select: "_id username name photo",
      })
      .populate({
        path: "followers",
        select: "_id username name photo",
      })
      .populate({
        path: "blockedList",
        select: "_id username name photo",
      })
      .populate("conversations");

    startFinding
      .then(function (data) {
        if (!data) return errorResponce(res, "User does not exist");

        res
          .status(200)
          .header({
            "content-type": "application/json",
          })
          .send({
            status: "Found One Users By Id",
            data: data,
          });
      })
      .catch(function (err) {
        errorResponce(res, "internal server error");
      });
  } else {
    let startFinding = dbUsers.find().select("name username _id photo");
    startFinding
      .then(function (data) {
        res
          .status(200)
          .header({
            "content-type": "application/json",
          })
          .send({
            status: "Found All Users",
            data: data,
          });
      })
      .catch(function (err) {
        errorResponce(res, "internal server error");
      });
  }
});

//get user minor data using username

app.route("/minorusers/:key/:token/:username").get(function (req, res) {
  let startFinding = dbUsers
    .findOne({ username: req.params.username })
    .select("photo name username");

  startFinding
    .then(function (data) {
      if (!data) return errorResponce(res, "User does not exist");

      res
        .status(200)
        .header({
          "content-type": "application/json",
        })
        .send({
          status: "Found One Minor User Data",
          data: data,
        });
    })
    .catch(function (err) {
      errorResponce(res, "internal server error");
    });
});

//Forgot password - send to email

app.get("/pass/:key/:email", function (req, res) {
  dbUsers
    .findOne({ email: req.params.email })
    .then(function (data) {
      if (!data) return errorResponce(res, "User does not exist");

      const token = jwt.sign({ email: req.params.email }, process.env.jwtkey, {
        expiresIn: "10m",
      });

      const options = {
        from: "zone@gmail.com",
        to: req.params.email,
        subject: "Zone Password Reset",
        html: emails.emitEmailHtml(
          `Here is your password reset link: <br> https://zoneexpressserver.herokuapp.com/reset?t=${token}`
        ),
      };

      emails.emailer(options);

      res.status(200).send({
        status: "Please check your email for your password reset link",
      });
    })
    .catch(function (err) {
      errorResponce(res, "Internal Server Error", err.message);
    });
});

//Send html for password change
app.get("/reset", function (req, res) {
  const token = req.query.t;

  jwt.verify(token, process.env.jwtkey, function (err, obj) {
    if (err) return errorResponce(res, "Internal Server Error");

    res
      .status(200)
      .header({
        "content-type": "text/html",
      })
      .send(html.renderPasswordHTML());
  });
});

//Now reset password with info coming from html
app.post("/updatePass/:token", function (req, res) {
  if (!req.body.password) return errorResponce(200, "Failed");
  let token = req.params.token;
  let newPass = req.body.password;
  jwt.verify(token, process.env.jwtkey, function (err, obj) {
    if (err) return errorResponce(200, "Authentication Failed");
    let userEmail = obj.email;
    dbUsers
      .findOneAndUpdate(
        { email: userEmail },
        { password: newPass },
        {
          runValidators: true,
        }
      )
      .then(function () {
        res
          .status(200)
          .header({
            "content-type": "application/json",
          })
          .send({
            status: "Password Change Succesful",
          });
      })
      .catch(function (err) {
        errorResponce(res, "internal server error", err.message);
      });
  });
});

//Tweets Routes
let tweets = require("./tweets.js");

app.use("/tweets/:key/:token", tweets.tweetSapp);

//Follow - Unfollow Routes

let follow = require("./follow.js");

app.use("/interact/:key/:token", follow.followapp);

//File Upload

let file = require("./file.js");

app.use("/file/:key/:token", file.fileapp);

//Messaging feature
const messaging = require("./messaging.js");

app.use("/message/:key/:token", messaging.msgapp);

app.use(function (req, res) {
  errorResponce(res, "Cannot Find Route");
});
