const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const mongooseDelete = require('mongoose-delete');

const keys = require.main.require('./app/config/keys');
const strings = require.main.require('./app/config/strings');

// Make email and phone docs unique except for those that are flagged as deleted
const uniquePartialIndex = {
    unique: true,
    partialFilterExpression: {
        deleted: false
    }
};

const UserSchema = new Schema({
    name: {
        first:  {type: String, required: true},
        last:   {type: String, required: true}
    },
    email:      {type: String},
    phone:      {type: String},
    photo:      {type: String, default: strings.userPhotoUrl},
    google: {
        id:           {type: String},
        accessToken:  {type: String},
        refreshToken: {type: String}
    },
    isAdmin: {type: Boolean, default: false},
    ip: String
}, {
    timestamps: true
});

UserSchema.statics.encryptAccessToken = function(plainText) {
    const iv = crypto.randomBytes(16); // Generate a random IV
    const cipher = crypto.createCipheriv(keys.encryption.algorithm, keys.encryption.key, iv);
    let encrypted = cipher.update(plainText, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Prepend IV to the encrypted text
};

UserSchema.statics.decryptAccessToken = function(cipher) {
    const textParts = cipher.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv(keys.encryption.algorithm, keys.encryption.key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
};

UserSchema.plugin(mongooseDelete, {overrideMethods: true});

UserSchema.index({email: 1, phone: 1}, uniquePartialIndex);

var User = mongoose.model('User', UserSchema);

module.exports = User;