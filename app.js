require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: "passwordTest.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Data base

mongoose.connect("mongodb://localhost:27017/userDB", { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: [{
        type: String
    }]
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function(err, user) {

            return cb(err, user);
        });
    }
));


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

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {

        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {

                res.redirect("/secret");

            })
        }

    })








    // User.findOne({ email: req.body.username }, function(err, rs) {
    //     if (err) {
    //         console.log(err);
    //     } else if (rs) {
    //         bcrypt.compare(req.body.password, rs.password, function(err, result) {
    //             if (result === true) {
    //                 res.render("secrets");
    //             } else {
    //                 res.send("verify your email or your password")
    //             }
    //         });

    //     }



    // });

})

// ***************************************register route ***************************************************

app.route("/register")

.get(function(req, res) {

    res.render("register");

})

.post(function(req, res) {


    User.register({ username: req.body.username, role: "artiste" }, req.body.password, function(err, user) {
        if (err) {
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {

                res.redirect("/secret");

            })
        }

    })








    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });
    //     newUser.save(function(err) {

    //         if (!err) {
    //             res.render("secrets");
    //         } else {
    //             console.log(err);
    //         }
    //     });
    // });



});

// ***************************************register and login with google route ***************************************************

app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/secret");
    });

// ***************************************secret route ***************************************************

app.route("/secret")
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            User.find({ "secret": { $ne: null } }, function(err, rs) {
                if (!err) {
                    if (rs) {
                        res.render("secrets", { userWithSecret: rs });
                    }
                }
            })


        } else {
            res.redirect("/login");
        }

    });
// ***************************************submit route ***************************************************
app.route("/submit")
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            res.render("submit");
        } else {
            res.redirect("/login");
        }

    })

.post(function(req, res) {
    const submitedSecret = req.body.secret;

    User.findById({ _id: req.user.id }, function(err, rs) {

        if (!err) {
            if (rs) {
                rs.secret.push(submitedSecret);
                rs.save(function() {

                    res.redirect("/secret");

                })
            }

        }

    })

})



// ***************************************logout route ***************************************************

app.route("/logout")

.get(function(req, res) {
    req.logout();
    res.redirect("/");

});





app.listen(3000, function() {
    console.log("Server started on port 3000");
});