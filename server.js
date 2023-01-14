const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());

const authenticate = async (req, res, next) => {
  let token = req.header('Authorization');
  token = token.replace('Bearer ', '');
  try {
    if (!token) {
      return res.status(401).send({error: 'Unauthorized: No token provided'});
    }

    const user = await User.findOne({'tokens.token': token});
    if (!user) {
      return res.status(401).send({error: 'Unauthorized: Invalid token'});
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).send({error: 'Internal server error'});
  }
};

mongoose.connect('mongodb://localhost:27017/projektWeb')
    .then(() => {
      console.log('Successfully connected to MongoDB');

      app.get('/users', authenticate, function(req, res) {
        User.find({}, function(error, users) {
          if (error) {
            res.status(500).send(error);
          } else {
            res.status(200).json(users);
          }
        });
      });

      app.get('/users/:id', authenticate, function(req, res) {
        User.findById(req.params.id, function(error, user) {
          if (error) {
            res.status(500).send(error);
          } else if (user) {
            res.status(200).json(user);
          } else {
            res.status(404).send('User not found');
          }
        });
      });

      app.post('/users', async (req, res) => {
        console.log('Hallo');
        console.log(req.body);
        try {
          // neues User-Dokument erstellen
          const user = new User({
            name: req.body.name,
            vorname: req.body.vorname,
            benutzername: req.body.benutzername,
            email: req.body.email,
            birthdate: req.body.birthdate,
            password: req.body.password,
            wohnsituation: req.body.wohnsituation,
            children: req.body.children,
            country_of_origin: req.body.country_of_origin,
          });
          console.log(user);

          // Generiere den Token
          const token = await user.generateAuthToken();
          user.tokens = user.tokens.concat({token});
          await user.save();
          res.send(user);
        } catch (err) {
          res.send('Fehler beim Speichern des Users: ' + err);
        }
      });

      app.post('/users/login', async (req, res) => {
        // Versuchen Sie, einen Benutzer mit dem angegebenen Benutzernamen zu finden
        const user = await User.findOne({email: req.body.email});
        if (!user) {
          // Benutzer nicht gefunden: Antwort mit Fehlermeldung zurücksenden
          return res.status(401).send({error: 'Invalid login credentials'});
        }

        // Überprüfen Sie, ob das Passwort korrekt ist
        const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordValid) {
          // Falsches Passwort: Antwort mit Fehlermeldung zurücksenden
          return res.status(401).send({error: 'Invalid login credentials'});
        }

        // Generieren Sie einen Token für den Benutzer
        const token = await user.generateAuthToken();

        // Fügen Token dem Benutzer hinzu
        user.tokens = user.tokens.concat({token});
        await user.save();

        // Antwort mit dem Token zurücksenden
        res.send({token});
      });

      app.post('/users/logout', async (req, res) => {
        try {
          const token = req.get('authorization').split(' ')[1];
          if (!token) {
            return res.status(401).send({error: 'Unauthorized: No token provided'});
          }

          const user = await User.findOne({'tokens.token': token});
          if (!user) {
            return res.status(401).send({error: 'Unauthorized: Invalid token'});
          }

          const tokens = user.tokens.filter((t) => t.token !== token);
          const result = await User.updateOne({'tokens.token': token}, {tokens});
          res.send({message: 'Successfully logged out' + ' ' + result});
        } catch (error) {
          res.status(500).send({error: 'Internal server error'});
        }
      });


      app.patch('/users/:id', authenticate, function(req, res) {
        User.findById(req.params.id, function(error, user) {
          if (error) {
            res.status(500).send(error);
          } else if (user) {
            if (req.body.name) user.name = req.body.name;
            if (req.body.vorname) user.vorname = req.body.vorname;
            if (req.body.benutzername) user.benutzername = req.body.benutzername;
            if (req.body.email) user.email = req.body.email;
            if (req.body.wohnsituation) user.wohnsituation = req.body.wohnsituation;
            if (req.body.children) user.children = req.body.children;

            user.save(function(error) {
              if (error) {
                res.status(500).send(error);
              } else {
                res.status(200).json(user);
              }
            });
          } else {
            res.status(404).send('User not found');
          }
        });
      });

      app.delete('/users/:id', authenticate, function(req, res) {
        User.findByIdAndDelete(req.params.id, function(error) {
          if (error) {
            res.status(500).send(error);
          } else {
            res.status(200).send('User deleted');
          }
        });
      });

      app.listen(3001, () => {
        console.log('Server listening on port 3001');
      });
    })
    .catch((err) => console.error('Fehler beim Herstellen der Verbindung zur MongoDB: ' + err));
