const User = require('../models/User');

/**
 * Role-guard middleware factory.
 * Usage: router.get('/route', auth, requireRole('recruiter'), handler)
 */
const requireRole = (role) => async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('role');
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    if (user.role !== role) {
      return res.status(403).json({
        error: `Access denied. This endpoint requires the '${role}' role.`
      });
    }
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error('Role guard error:', err);
    res.status(500).json({ error: 'Server error during authorization.' });
  }
};

module.exports = requireRole;
