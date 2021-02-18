const mongoose = require('mongoose');

exports.connectDB = function() {
    mongoose.connect("mongodb://localhost:27017/userDB", { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false });
    mongoose.set('useCreateIndex', true);
}


exports.userSchema = function() {

    const userSchema = new mongoose.Schema({
        username: String,
        password: String,
        // role: { type: String, required: true },
        googleId: String,
        secret: [{
            type: String

        }],
    });

    return userSchema;

}

exports.userModel = function(userSchema) {
    const User = mongoose.model("User", userSchema);

    return User;
}



exports.getSecrets = function(User) {
    const v = User.find({ "secret": { $ne: null } }).exec();
    return v;
}

exports.addSecret = function(User, secret, userId) {
    return User.findById({ _id: userId }, function(err, rs) {

        if (!err) {
            if (rs) {
                rs.secret.push(secret);
                rs.save();
            }

        }

    })
}