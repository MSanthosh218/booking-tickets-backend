import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  try {
    // Verify the token using your JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user data (id, email, role) to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(403).json({ message: 'Forbidden: Invalid or expired token.' });
  }
};

// Middleware to authorize specific roles
export const authorizeRoles = (roles) => {
  return (req, res, next) => {
    // Ensure req.user exists (from authenticate middleware)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: User role not found.' });
    }

    // Check if the user's role is included in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Forbidden: Access denied. Required roles: ${roles.join(', ')}.` });
    }

    next(); // User is authorized, proceed
  };
};