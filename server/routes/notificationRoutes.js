const express = require('express');
const protect = require('../middleware/auth');
const Notification = require('../models/Notification');
const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
