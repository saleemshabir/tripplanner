const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !password) {
      return res.status(400).json({ message: 'Name, email and password are all required' });
    }
    if (!validator.isEmail(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });

    res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email },
      token: signToken(user._id)
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    res.json({
      user: { _id: user._id, name: user.name, email: user.email },
      token: signToken(user._id)
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ _id: req.user._id, name: req.user.name, email: req.user.email });
}

module.exports = { register, login, me };
