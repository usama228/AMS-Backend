const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
const isAuthenticated = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token missing or invalid' });
      }
  
      const token = authHeader.split(' ')[1];
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      const user = await User.findByPk(decoded.id); 
  
      if (!user) {
        return res.status(401).json({ message: 'User not found or not authorized' });
      }
      req.user = user;
  
      next();
    } catch (error) {
      console.error('Authentication error:', error);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token', error: error.message });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired', error: error.message });
      }
  
      return res.status(500).json({ message: 'An internal error occurred', error: error.message });
    }
  };
const extractUserId = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: 'Authorization Headers is Missing'
        })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
            return res.status(403).json({
                message: 'Invalid Token'
            })
        }

        req.userId = decodedToken.id
        req.userType = decodedToken.userType
        next()
    })
}

const isAdminOrTeamLead = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
      return res.status(401).json({
          message: 'Authorization Headers is Missing'
      })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
          return res.status(403).json({
              message: 'Invalid Token'
          })
      }

      req.userId = decodedToken.id
      req.userType = decodedToken.userType
      req.isTeamLead = decodedToken.isTeamLead
      next()
  })
}
const ERROR_LIST={
  
  GET_SUCCESSFULLY:'Record List Fetched Successfully',
  UPDATE:'Record Updated Successfully',
  NOT_FOUND:'Record Not Found',
  ALL_FIELD_REQUIRED:'Fill All Fields',
  
}
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; 
  d.setDate(d.getDate() + diff); 
  return d;
}
module.exports = {getMonday,ERROR_LIST,isAdminOrTeamLead, extractUserId, protect,isAuthenticated };
