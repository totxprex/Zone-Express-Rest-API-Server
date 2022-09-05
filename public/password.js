'use strict'

let serverURL = `http://127.0.0.3:5500`
let token = document.location.href.split("=")[1]

document.querySelector('.login').addEventListener("click", function (e) {
  e.preventDefault()
  if (!document.querySelector(".login-pass").value) return alert("Please fill in your new password")

  document.querySelector('.login').textContent = `Loading`

  fetch(`${serverURL}/updatePass/${token}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ password: document.querySelector(".login-pass").value })
  }).then(function (e) {
    if (e.status === 404) {
      throw new Error()
    }
    return e.json()
  }).then(function (data) {
    document.querySelector('body').remove()
    setTimeout(function () {
      alert("Password change successful!")
    }, 1000)
  }).catch(function () {
    document.querySelector('.login').textContent = `Reset Password`
    alert("Internal Server Error")
  })
})