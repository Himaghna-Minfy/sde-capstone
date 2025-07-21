const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(AuthMiddleware.authenticate);

router.get('/active', async (req, res) => {
  res.json({ users: [] });
});

module.exports = router;
