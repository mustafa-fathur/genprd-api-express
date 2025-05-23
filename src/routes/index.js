const router = require('express').Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const personnelRoutes = require('./personnel.routes');
const prdRoutes = require('./prd.routes');
const authMiddleware = require('../middleware/auth.middleware');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/users', authMiddleware, userRoutes);
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/personnel', authMiddleware, personnelRoutes);
router.use('/prd', authMiddleware, prdRoutes);

module.exports = router;