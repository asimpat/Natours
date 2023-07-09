const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Input your name!!'],
  },

  email: {
    type: String,
    required: [true, 'Input you E-mail'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },

  role: {
    type: String,
    enum: ['user', 'tour-guide', 'lead-guide', 'admin'],
    default: 'user',
  },

  photo: String,

  password: {
    type: String,
    required: [true, 'please provide a Password'],
    minlength: [8, 'A Password must have less or equal 8 characters'],
    select: false,
  },

  confirmPassword: {
    type: String,
    required: [true, 'Please confirm Password'],
    validate: {
      // this works on every CREATE or SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same. confirm password',
    },
  },

  passwordChangedAt: Date,

  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // run this function if password was actually modified
  if (!this.isModified('password')) return next();

  //   hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //   delete confirmpassword
  this.confirmPassword = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  // run this function if password was not actually modified or A NEW DOCUMENT(new user) WAS CREATED
  if (!this.isModified('password') || this.isNew) return next();

  //update the time when password was changed for the user(token time always comes adhead)
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this point to the find query
  this.find({ active: { $ne: false } });
  next();
});

// creating an instance Method
userSchema.methods.correctPassword = async function (
  candinatePassword,
  userPassword
) {
  return bcrypt.compare(candinatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changeTime;
  }

  // False MEANS PASSWORD IS NOT CHANGED (the day and time the
  // token was issue is less than the changed timestap)
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrpting the resetToken in the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // to set the expired time of reseting password with token to 10minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
