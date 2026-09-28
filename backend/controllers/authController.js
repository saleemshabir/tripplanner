const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are all required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email },
      token: signToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not create account', error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      // Deliberately vague so we don't reveal which accounts exist.
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    res.json({
      user: { _id: user._id, name: user.name, email: user.email },
      token: signToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not log in', error: err.message });
  }
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ _id: req.user._id, name: req.user.name, email: req.user.email });
}

module.exports = { register, login, me };
