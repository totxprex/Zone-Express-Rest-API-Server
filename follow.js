const express = require("express")
let { dbUsers, dbSockets, dbTweets } = require("./schemas.js")

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

let followapp = express.Router()
let acter

//follow a user by adding user to user following Array

followapp.get("/follow/:followingUserID/:followedUserID", function (req, res) {
  let followingUserID = req.params.followingUserID
  let theFollowedUserID = req.params.followedUserID

  dbUsers.findById(followingUserID).then(function (data) {
    acter = data.username
    let followingArr = data.following
    followingArr.push(theFollowedUserID)

    dbUsers.findByIdAndUpdate(followingUserID, { following: followingArr }, {
      runValidators: true
    }).then(function () {
      //to notify the followed user

      dbUsers.findById(theFollowedUserID).then(function (data) {
        let followersArr = data.followers
        followersArr.push(followingUserID)
        let notificationArr = data.notifications
        notificationArr.push({
          notificationType: "followed",
          notificationMessage: `@${acter} followed you`
        })

        dbUsers.findByIdAndUpdate(theFollowedUserID, { notifications: notificationArr, followers: followersArr }, {
          runValidators: true
        }).then(function () {
          responce(res, "User Followed")
        })
      })
    })
  }).catch(function () {
    errorResponce(res, err.message)
  })
})


//unfollow a user by removing user from your list of following array

followapp.get("/unfollow/:unfollowingUserID/:unfollowedUserID", function (req, res) {
  let unfollowingUserID = req.params.unfollowingUserID
  let theUnFollowedUserID = req.params.unfollowedUserID

  dbUsers.findById(unfollowingUserID).then(function (data) {
    let userFollowingArr = [...data.following]
    let doneArray = userFollowingArr.filter(function (e, i) {
      return String(e) !== theUnFollowedUserID
    })
    dbUsers.findByIdAndUpdate(unfollowingUserID, { following: doneArray }, {
      runValidators: true
    }).then(function () {
      dbUsers.findById(theUnFollowedUserID).then(function (data) {
        let userfollowersArr = [...data.followers]
        let doneArray2 = userfollowersArr.filter(function (e, i) {
          return String(e) !== unfollowingUserID
        })
        dbUsers.findByIdAndUpdate(theUnFollowedUserID, { followers: doneArray2 }, {
          runValidators: true
        }).then(function () {
          responce(res, "User Unfollowed")
        })
      }).catch(function (err) {
        errorResponce(res, err.message)
      })

    })

  }).catch(function (err) {
    errorResponce(res, err.message)
  })

})



//block a user by adding to user blocked list
followapp.delete("/block/:userID/:blockedUserID", function (req, res) {
  let userID = req.params.userID
  let tobeBlockedUser = req.params.blockedUserID
  dbUsers.findById(userID).then(function (data) {
    let blockedListArr = data.blockedList
    blockedListArr.push(tobeBlockedUser)

    dbUsers.findByIdAndUpdate(userID, { blockedList: blockedListArr }, {
      runValidators: true
    }).then(function () {
      responce(res, "User Blocked!")
    }).catch(function (err) {
      errorResponce(res, err.message)
    })
  }).catch(function (err) {
    errorResponce(res, err.message)
  })
})
















module.exports = { followapp }