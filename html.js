const renderPasswordHTML = function () {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zone - The Social Media Platform</title>
    <link rel="icon" href="/logo1.png">
    <link rel="stylesheet" href="/pasword.css">
  </head>
  <body>
    <main class="login-main">
      <form class="login_cont ">
        <img class="login-logo" src="/logo1.png">
        <h3>NEW PASSWORD</h3>
        <input type="password" placeholder="Password" class="login-pass" autocomplete="new-password">
        <button class="login">
          Reset Password
        </button>
      </form>
    </main>
  </body>
  <script src="/password.js"></script>
  </html>`
}


module.exports = { renderPasswordHTML }