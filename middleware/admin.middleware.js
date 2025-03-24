const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Get user from database
        const user = await User.findById(decoded.id);
        
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        // Add user to request
        req.user = user;
        next();

    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ message: 'Token is not valid' });
    }
}; 