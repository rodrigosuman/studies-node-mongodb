const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const authConfig = require('../../config/auth.json');

const User = require('../models/user');

const router = express.Router();

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).send({ error: 'User already exists.' });

    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({ user, token: generateToken({ id: user.id }) });
  } catch {
    return res.status(400).send({ error: 'Registrarion failed' });
  }
});

router.post('/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) return res.status(400).send({ error: 'User not find.' });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(401).send({ error: 'Mismatched credentials.' });

    user.password = undefined;

    return res.send({ user, token: generateToken({ id: user.id }) });
  } catch {
    return res.status(400).send({ error: 'Authentication failed' });
  }
});

router.post('/forgot_password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send({ error: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now,
      },
    });

    mailer.sendMail(
      {
        to: 'rodrigosuman18@gmail.com',
        from: 'rodrigosumanzz@gmail.com',
        template: 'forgot_password',
        context: { token },
      },
      err => {
        if (err) {
          return res
            .status(400)
            .send({ error: 'Cannot send forgot password email' });
        }

        res.status(204).send();
      }
    );
  } catch (error) {
    res.status(400).send({ error: 'Error on forgot password, try again' });
  }
});

module.exports = app => app.use('/auth', router);
