let mongoose = require('mongoose')
let validator = require('validator')


//Users Schema

let userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Validation Error"]
  },
  email: {
    type: String,
    validate: validator.isEmail,
    required: [true, "Email Validation Error"]
  },
  mobileNumber: {
    type: String
  },
  username: {
    type: String,
    required: [true, "username Validation Error"],
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  password: {
    type: String,
    select: false,
    required: [true, "passsword Validation Error"]
  },
  photo: {
    type: String,
    default: ""
  },
  about: String,
  tweets: [{
    type: mongoose.Schema.ObjectId,
    ref: "Tweets"
  }],
  retweets: [{
    type: mongoose.Schema.ObjectId,
    ref: "Tweets"
  }],
  likedTweets: [{
    type: mongoose.Schema.ObjectId,
    ref: "Tweets"
  }],
  followers: [{
    type: mongoose.Schema.ObjectId,
    ref: "Users"
  }],
  following: [{
    type: mongoose.Schema.ObjectId,
    ref: "Users"
  }],
  signupDate: {
    type: Date,
    default: Date.now()
  },
  socketObjId: {
    type: mongoose.Schema.ObjectId,
    ref: "Sockets"
  },
  notifications: [
    {
      notificationType: {
        type: String,
        enum: ["liked", "retweeted", "replied", "followed"],
        required: [true, "notification Validation Error"]
      },
      notificationMessage: {
        type: String,
        required: [true, "notification Validation Error"]
      },
      notificationDate: {
        type: Date,
        default: Date.now()
      },
      repliedText: {
        type: String,
        default: ""
      },
      tweetID: {
        type: mongoose.Schema.ObjectId,
        ref: "Tweets"
      }
    }
  ],
  conversations: [{
    type: mongoose.Schema.ObjectId,
    ref: "Rooms"
  }],
  blockedList: [{
    type: mongoose.Schema.ObjectId,
    ref: "Users"
  }]
})

userSchema.index({ username: 1 }, { unique: true })


let dbUsers = mongoose.model("Users", userSchema)













//Tweets Schema

let tweetsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Validation Error"]
  },
  username: {
    type: String,
    required: [true, "username Validation Error"]
  },
  userID: {
    type: mongoose.Schema.ObjectId,
    ref: "Users",
    required: [true, "username Validation Error"]
  },
  postText: {
    type: String,
    trim: true,
    required: [true, "No Post Text"],
    maxLength: 400
  },
  postPhoto: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  replies: [{
    name: {
      type: String,
      required: [true, "Name Validation Error"]
    },
    username: {
      type: String,
      required: [true, "username Validation Error"]
    },
    reply: {
      type: String,
      required: [true, "username Validation Error"],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    replyReplies: Array
  }],
  retweeters: [{
    type: mongoose.Schema.ObjectId,
    ref: "Users"
  }],
  likers: [{
    type: mongoose.Schema.ObjectId,
    ref: "Users"
  }]
})


tweetsSchema.index({ username: 1 })

tweetsSchema.post("save", function (obj, next) {
  let username = obj.username
  dbUsers.findOne({ username: username }).then(function (data) {
    let usersTweet = data.tweets
    usersTweet.push(obj._id)
    dbUsers.findOneAndUpdate({ username: username }, { tweets: usersTweet }, {
      runValidators: true
    }).then(function () {
      next()
    }).catch(function (err) {
      console.log(err.message)
      next()
    })
  })

})

tweetsSchema.pre(/^find/, function () {
  this.populate({
    path: "userID",
    select: "username name _id photo"
  })
})

let dbTweets = mongoose.model("Tweets", tweetsSchema)








//Socket Schema

let socketSchema = new mongoose.Schema({
  socketId: {
    type: String
  },
  name: {
    type: String
  },
  username: {
    type: String
  },
  online: Boolean
})

socketSchema.index({ username: 1 }, { unique: true })

let dbSockets = mongoose.model("Sockets", socketSchema)









///Messaging collection schema
let messagingSchema = new mongoose.Schema({
  firstUserID: {
    type: mongoose.Schema.ObjectId,
    ref: "Users",
    required: [true, "Messaging validation error"]
  },
  secondUserID: {
    type: mongoose.Schema.ObjectId,
    ref: "Users",
    required: [true, "Messaging validation error"]
  },
  messages: [{
    createdAt: {
      type: Date,
      default: Date.now()
    },
    message: {
      type: String,
      required: [true, "Messaging validation error"]
    },
    senderUserName: {
      type: String,
      required: [true, "Messaging validation error"]
    },
    senderName: {
      type: String,
      required: [true, "Messaging validation error"]
    },
    senderPhoto: {
      type: String,
      default: ""
    },
    senderID: {
      type: mongoose.Schema.ObjectId,
      ref: "Users",
      required: [true, "Messaging validation error"]
    }
  }]
})

messagingSchema.index({ firstUserID: 1, secondUserID: 1 }, { unique: true })

messagingSchema.post("save", function (obj, next) {
  //user 1
  dbUsers.findById(obj.firstUserID).then(function (data) {
    let userConvos = data.conversations
    userConvos.push(obj._id)

    dbUsers.findByIdAndUpdate(obj.firstUserID, { conversations: userConvos }, {
      runValidators: true
    }).then(function () {

      //user 2
      dbUsers.findById(obj.secondUserID).then(function (data) {
        let userConvos2 = data.conversations
        userConvos2.push(obj._id)

        dbUsers.findByIdAndUpdate(obj.secondUserID, { conversations: userConvos2 }, {
          runValidators: true
        }).then(function () {
          next()
        })
      })
    })
  }).catch(function (err) {
    console.log(err.message)
    next()
  })
})

messagingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "firstUserID",
    select: "name username photo _id"
  }).populate({
    path: "secondUserID",
    select: "name username photo _id"
  })
  next()
})


let dbRooms = mongoose.model("Rooms", messagingSchema)



































module.exports = { dbUsers, dbTweets, dbSockets, dbRooms }