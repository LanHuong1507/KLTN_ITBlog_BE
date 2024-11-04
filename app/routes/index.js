const userRoute = require("./user.routes.js");
const authRoute = require("./auth.routes.js");
const categoryRoute = require("./category.routes.js");
const articleRoute = require("./article.routes.js");
const commentRoute = require("./comment.routes.js");
const likeRoute = require("./like.routes.js");
const notificationRoute = require("./notification.routes.js");
const followerRoute = require("./follower.routes.js");
const otherRoute = require("./other.routes.js");

function route(app){
    app.use("/articles", articleRoute);
    app.use("/others", otherRoute);
    app.use("/comments", commentRoute);
    app.use("/followers", followerRoute);
    app.use("/notifications", notificationRoute);
    app.use("/categories", categoryRoute);
    app.use("/users", userRoute);
    app.use("/likes", likeRoute);
    app.use("/auth", authRoute);
}

module.exports = route