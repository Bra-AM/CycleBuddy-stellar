const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'hackathon_secret';
  const payload = { 
    userId: user.id, 
    username: user.username, 
    email: user.email || user.mail 
  };
  
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

// Helper function to format user response
const formatUserResponse = (user, token, message) => {
  return {
    message,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      lastName: user.lastName || user.last_name,
      email: user.email || user.mail
    }
  };
};

const authenticateUser = (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret');
        const userId = decoded.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Add user ID to request object for use in route handlers
        req.userId = userId;
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Make sure the function is properly exported
module.exports = {
    authenticateUser,
    generateToken,
    formatUserResponse
};
