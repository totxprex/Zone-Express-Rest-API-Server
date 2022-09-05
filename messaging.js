let express = require("express")
let msgapp = express.Router()
let { dbUsers, dbSockets, dbTweets, dbRooms } = require("./schemas.js")

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



//Create a new room 

msgapp.post("/createroom", function (req, res) {
  if (!req.body.firstUserID || !req.body.secondUserID) return errorResponce(res, "No room attached")

  dbRooms.create(req.body).then(function (data) {
    res.status(200).header({
      "content-type": "application/json"
    }).send({
      status: "room created",
      roomID: data._id
    })
  }).catch(function (err) {
    errorResponce(res, err.message)
  })

})


//Send a message

msgapp.post("/send/:roomID", function (req, res) {
  let room = req.params.roomID

  if (!req.body.message) return errorResponce(res, "No room attached")

  dbRooms.findById(room).then(function (data) {
    if (req.body.senderUserName === data.firstUserID.username || req.body.senderUserName === data.secondUserID.username) {
      let roomMessages = data.messages
      roomMessages.push(req.body)
      dbRooms.findByIdAndUpdate(room, { messages: roomMessages }, {
        runValidators: true
      }).then(function () {
        responce(res, "Message Sent!")
      }).catch(function (err) {
        errorResponce(res, err.message)
      })
    }
    else {
      errorResponce(res, "User not in this room")
    }
  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})



//Get a room by ID 
msgapp.get("/getroom/:roomID", function (req, res) {
  dbRooms.findById(req.params.roomID).then(function (data) {
    if (!data.secondUserID) return errorResponce(res, "Invalid Room ID")

    responce(res, "Found One Room", data)

  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})




































module.exports = { msgapp }