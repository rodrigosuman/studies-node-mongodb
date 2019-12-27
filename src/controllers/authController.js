const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

const router = express.Router();

router.post('/register', async (request, response) => {
  try {
    const { email } = request.body;

    if (await User.findOne({ email }))
      return response.status(400).send({ error: 'User already exists.' });

    const user = await User.create(request.body);

    user.password = undefined;

    return response.send(user);
  } catch {
    return response.status(400).send({ error: 'responsegistrarion failed' });
  }
});

router.post('/authenticate', async (request, response) => {
  try {
    const { email, password } = request.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) return response.status(400).send({ error: 'User not find.' });

    if (!(await bcrypt.compare(password, user.password)))
      return response.status(401).send({ error: 'Mismatched credentials.' });

    return response.send(user);
  } catch {
    return response.status(400).send({ error: 'Authentications failed' });
  }
});

module.exports = app => app.use('/auth', router);
