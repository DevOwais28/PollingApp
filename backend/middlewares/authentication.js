import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. Token format invalid."
      });
    }

    const decoded = jwt.verify(token, secret);
    // JWT decoded successfully:
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired."
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Authentication error."
      });
    }
  }
};

export default authenticate;