let userFormat = {
  "name": "Kunle Mumuney",
  "email": "kxprex@gmail.com",
  "username": "kxprex",
  "dateOfBirth": "12/7/1992",
  "password": "1234",
  "photo": "",
  "about": "User",
  "tweets": [
  ],
  "retweets": [
  ],
  "likedTweets": [
  ],
  "followers": [
  ],
  "following": [
  ],
  "notifications": [],
  "conversations": [],
  "blockedList": []
}


let socketFormat = {
  "socketId": "",
  "name": req.body.name,
  "username": req.body.username,
  "online": false
}


let tweet = {
  "name": "Eunice Dopamu",
  "username": "totxprex",
  "postText": "Happy birthday to me. May my years be longerr!",
  "postPhoto": "",
  "replies": [],
  "retweeters": [],
  "likers": []
}

let tweetReply = {
  "name": "Kunle Mumuney",
  "username": "kxprex",
  "reply": "hahahaa it is what it is, just endure",
  "replyReplies": []
}


let messageFormat = {
  message: "",
  senderUserName: "",
  senderName: "",
  senderPhoto: "",
  senderID: ""
}


let createRoomFormat = {
  firstUserID: "",
  secondUserID: "",
  messages: []
}