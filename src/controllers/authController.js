const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json');

const User = require('../models/user');

const router = express.Router();

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

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

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

module.exports = app => app.use('/auth', router);
