const userRoute = require("./user.routes.js");
const authRoute = require("./auth.routes.js");
const followerRoute = require("./follower.routes.js");
const notificationRoute = require("./notification.routes.js");
const articleRoute = require("./article.routes.js");
function route(app){
    app.use("/followers", followerRoute);
    app.use("/users", userRoute);
    app.use("/auth", authRoute);
    app.use("/notifications", notificationRoute);
    app.use("/articles", articleRoute);
}

module.exports = route