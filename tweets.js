const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
let { dbUsers, dbSockets, dbTweets } = require("./schemas.js")

const upload = multer({ storage: multer.memoryStorage() })

let errorResponce = function (responceObj, message, err) {
  responceObj.status(404).header({
    "content-type": "application/json"
  }).send({
    status: message || "Error",
    error: err || "Error"
  })
}

let responce = function (responceObj, status, data) {
  responceObj.status(200).header({
    "content-type": "application/json"
  }).send({
    status: status || "Task Done",
    data: data || ""
  })
}

let tweetSapp = express.Router()

//Create a tweet and upload tweet img if there
tweetSapp.route("/create").post(upload.single("postPhoto"), function (req, res) {
  if (!req.body) return errorResponce(res, "Internal Server Error")

  let fileName = `tweet-${req.body.username}-${Date.now()}.jpeg`

  if (req?.file?.buffer) {
    sharp(req.file.buffer).resize(400, 300).toFormat("jpeg").jpeg({
      quality: 90
    }).toFile(`./public/tweet-images/${fileName}`).then(function () {
      req.body.postPhoto = fileName
      dbTweets.create(req.body).then(function (data) {
        res.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "Tweet Created",
          data: data
        })
      }).catch(function (err) {
        errorResponce(res, err.message)
      })
    }).catch(function () {
      errorResponce(res, "Internal Server Error")
    })
  }

  else {
    dbTweets.create(req.body).then(function (data) {
      res.status(200).header({
        "content-type": "application/json"
      }).send({
        status: "Tweet Created",
        data: data
      })
    }).catch(function (err) {
      errorResponce(res, err.message)
    })
  }
})


//retweet a tweet
let tweetOwner
let acter
tweetSapp.get("/retweet/:tweetID/:userID", function (req, res) {
  let tweetID = req.params.tweetID
  let userID = req.params.userID
  dbTweets.findById(tweetID).then(function (data) {
    tweetOwner = data.username
    let retweetersArr = data.retweeters

    if (retweetersArr.includes(userID)) return responce(res, "Done")

    retweetersArr.push(userID)
    dbTweets.findByIdAndUpdate(tweetID, { retweeters: retweetersArr }, {
      runValidators: true
    }).then(function () {
      dbUsers.findById(userID).then(function (data) {
        acter = data.username
        let retweetsArr = data.retweets
        retweetsArr.push(tweetID)
        dbUsers.findByIdAndUpdate(userID, { retweets: retweetsArr }, {
          runValidators: true
        }).then(function () {
          dbUsers.findOne({ username: tweetOwner }).then(function (data) {
            let notificationArr = data.notifications
            notificationArr.push({
              notificationType: "retweeted",
              notificationMessage: `@${acter} retweeted your tweet`,
              tweetID: `${req.params.tweetID}`
            })
            dbUsers.findOneAndUpdate({ username: tweetOwner }, { notifications: notificationArr }, {
              runValidators: true
            }).then(function () {
              responce(res, "Tweet Retweeted")
            })
          })
        })
      }).catch(function (err) {
        errorResponce(res, err.message)
      })
    })
  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})


//Like a tweet
tweetSapp.get("/like/:tweetID/:userID", function (req, res) {
  let tweetID = req.params.tweetID
  let userID = req.params.userID
  dbTweets.findById(tweetID).then(function (data) {
    tweetOwner = data.username
    let likersArr = data.likers
    if (likersArr.includes(userID)) return responce(res, "Done")
    likersArr.push(userID)
    dbTweets.findByIdAndUpdate(tweetID, { likers: likersArr }, {
      runValidators: true
    }).then(function () {
      dbUsers.findById(userID).then(function (data) {
        acter = data.username
        let likesArr = data.likedTweets
        likesArr.push(tweetID)
        dbUsers.findByIdAndUpdate(userID, { likedTweets: likesArr }, {
          runValidators: true
        }).then(function () {
          dbUsers.findOne({ username: tweetOwner }).then(function (data) {
            let notificationArr = data.notifications
            notificationArr.push({
              notificationType: "liked",
              notificationMessage: `@${acter} liked your tweet`,
              tweetID: `${req.params.tweetID}`
            })
            dbUsers.findOneAndUpdate({ username: tweetOwner }, { notifications: notificationArr }, {
              runValidators: true
            }).then(function () {
              responce(res, "Tweet Liked")
            })
          })
        })
      }).catch(function (err) {
        errorResponce(res, err.message)
      })
    })
  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})


//Reply a tweet
tweetSapp.post("/reply/:tweetID", function (req, res) {
  if (!req.body.reply) return errorResponce(res, "Invalid Post Reply Body")

  let theTweetID = req.params.tweetID

  dbTweets.findById(theTweetID).then(function (data) {
    tweetOwner = data.username
    let repliesArr = data.replies
    repliesArr.push(req.body)
    dbTweets.findByIdAndUpdate(theTweetID, { replies: repliesArr }, {
      runValidators: true,
      new: true
    }).then(function (data) {
      dbUsers.findOne({ username: tweetOwner }).then(function (data) {
        let notificationArr = data.notifications
        notificationArr.push({
          notificationType: "replied",
          notificationMessage: `@${req.body.username} replied your tweet`,
          tweetID: `${req.params.tweetID}`,
          repliedText: req.body.reply
        })
        dbUsers.findOneAndUpdate({ username: tweetOwner }, { notifications: notificationArr }, {
          runValidators: true
        }).then(function () {
          responce(res, "Tweet Reply Recorded", data)
        })
      })

    })
  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})







//Get Timeline Tweets and Advanced Query

let sortOutUsersFollowing = function () {
  return function (req, res, next) {
    let user = req.params.username
    let startFinding = dbUsers.findOne({ username: user }).select("_id following").populate({
      path: "following",
      select: "_id username"
    })
    startFinding.then(function (data) {
      let usernameCollection = data.following.map(function (e, i) {
        return e.username
      })
      usernameCollection.push(req.params.username)
      req.query.usernames = usernameCollection
      next()
    }).catch(function (err) {
      errorResponce(res, err.message)
    })
  }
}


tweetSapp.get("/timeline/:username", sortOutUsersFollowing(), function (req, res) {

  let usernames = req.query.usernames

  let startFinding = dbTweets.find({ username: { $in: usernames } })

  if (req.query.sort) {
    startFinding.sort(req.query.sort.replaceAll(`,`, ` `))
  }

  if (req.query.fields) {
    startFinding.select(req.query.fields.replaceAll(",", ` `))
  }

  if (req.query.page) {
    let limit = Number(req.query.limit)
    let skip = Number(req.query.page - 1) * req.query.limit

    startFinding.skip(skip).limit(limit)
  }

  startFinding.then(function (data) {
    if (data.length === 0) {
      let startFinding = dbTweets.find({ username: "zone" })

      startFinding.then(function (data) {
        responce(res, "Zone Tweets", data)
      }).catch(function (err) {
        errorResponce(res, err.message)
      })
    }
    else {
      responce(res, "Found All Tweets", data)
    }

  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})



//Get all tweets

tweetSapp.get("/alltweets", function (req, res) {
  let startFinding = dbTweets.find()

  if (req.query.sort) {
    startFinding.sort(req.query.sort.replaceAll(`,`, ` `))
  }

  if (req.query.fields) {
    startFinding.select(req.query.fields.replaceAll(`,`, ` `))
  }

  if (req.query.page) {
    let limit = Number(req.query.limit)
    let skip = Number(req.query.page - 1) * limit
    startFinding.skip(skip).limit(limit)
  }


  startFinding.then(function (data) {
    res.status(200).header({
      "content-type": "application/json"
    }).send({
      status: "All Tweets Found",
      data: data
    })
  }).catch(function (err) {
    res.status(404).header({
      "content-type": "application/json"
    }).send({
      status: "Error finding all tweets",
      error: err.message
    })
  })
})




//Get a tweet by ID
tweetSapp.get("/onetweet/:id", function (req, res) {
  let startFinding = dbTweets.findById(req.params.id)
  if (req.query.pop === "populate") {
    startFinding.populate({
      path: "retweeters",
      select: "name username _id photo"
    }).populate({
      path: "likers",
      select: "name username _id photo"
    })
  }
  startFinding.then(function (data) {
    responce(res, "Found One Tweet", data)
  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})












module.exports = { tweetSapp }