const express = require("express")
let fileapp = express.Router()
const multer = require("multer")
const sharp = require("sharp")
let { dbUsers, dbSockets, dbTweets } = require("./schemas.js")
let errorResponce = function (responceObj, message, err) {
  responceObj.status(404).header({
    "content-type": "application/json"
  }).send({
    status: message || "Error",
    error: err || "Error"
  })
}


const upload = multer({ storage: multer.memoryStorage() })

//For user profile picture

fileapp.post("/userphoto/:username", upload.single("photo"), function (req, res) {
  if (!req.file.buffer) return errorResponce(res, "No Image Attached")
  let username = req.params.username
  let buffer = req.file.buffer
  let fileName = `user-${username}-${Date.now()}.jpeg`
  sharp(buffer)
    .resize(200, 200)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`./public/user-images/${fileName}`).then(function () {
      dbUsers.findOneAndUpdate({ username: username }, { photo: fileName }, {
        runValidators: true
      }).then(function () {
        res.status(200).header({
          "content-type": "application/json"
        }).send({
          status: "User Profile Picture Updated"
        })
      }).catch(function () {
        errorResponce(res, "User does not exist")
      })
    }).catch(function () {
      errorResponce(res, "Internal Server Error")
    })
})


















module.exports = { fileapp }