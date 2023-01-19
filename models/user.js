const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'meinSchlüssel';
const bcrypt = require('bcrypt');
const moment = require('moment');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  vorname: {
    type: String,
    required: true,
  },
  benutzername: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(value) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
      },
      message: 'Gebe bitte eine gültige Mail an!',
    },
  },
  birthdate: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        return moment(value, 'DD.MM.YYYY').isBefore(moment());
      },
      message: 'Geburtsdatum kann nicht in der Zukunft sein',
    },
  },
  password: {
    type: String,
    required: true,
  },
  wohnsituation: {
    type: String,
    required: true,
    enum: ['individuelles Wohnen', 'gemeinschaftliches Wohnen',
      'gemeinschaftliches Wohnen und Arbeiten', 'institutionelles Wohnen'],
  },
  children: {
    type: String,
    required: true,
  },
  country_of_origin: {
    type: String,
    required: true,
  },
  tokens: [{
    token: {
      type: String,
      required: true,
    },
  }],
});

// Methode zum Generieren eines Tokens
userSchema.methods.generateAuthToken = async function() {
  const token = jwt.sign({_id: this._id.toString()}, JWT_SECRET);
  this.token = token;
  await this.save();
  return token;
};

// Methode zum Entfernen des aktuellen Tokens
userSchema.methods.logout = async function() {
  this.token = null;
  await this.save();
};

// Methode zum Überprüfen des Passworts bei der Anmeldung
userSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function(next) {
  // eslint-disable-next-line no-invalid-this
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('save', async function(next) {
  // eslint-disable-next-line no-invalid-this
  const user = this;
  user.birthdate = moment(user.birthdate, 'DD.MM.YYYY').toDate();
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
