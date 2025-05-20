const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Ini Route PRD' });
});

module.exports = router;
