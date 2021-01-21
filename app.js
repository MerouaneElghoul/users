require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// Data base

mongoose.connect("mongodb://localhost:27017/userDB", { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});



userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });


const User = mongoose.model("User", userSchema);


// Data base code end here


// ***************************************home route ***************************************************

app.route("/")

.get(function(req, res) {
    res.render("home");

});


// ***************************************login route ***************************************************

app.route("/login")

.get(function(req, res) {

    res.render("login");

})

.post(function(req, res) {
    User.findOne({ email: req.body.username }, function(err, rs) {
        if (err) {
            console.log(err);
        } else if (rs) {
            if (rs.password === req.body.password) {
                res.render("secrets");
            } else {
                res.send("verify your email or your password")
            }

        }



    })

})

// ***************************************register route ***************************************************

app.route("/register")

.get(function(req, res) {

    res.render("register");

})

.post(function(req, res) {

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err) {

        if (!err) {
            res.render("secrets");
        } else {
            console.log(err);
        }
    });

})


app.listen(3000, function() {
    console.log("Server started on port 3000");
});