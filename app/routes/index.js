const userRoute = require("./user.routes.js");
const authRoute = require("./auth.routes.js");

function route(app){
    app.use("/users", userRoute);
    app.use("/auth", authRoute);
}

module.exports = route