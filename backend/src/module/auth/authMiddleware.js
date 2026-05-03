import ApiError from "../../common/utils/apiError.js";
import { verifyAccessToken } from "../../common/utils/jwtUtills.js";
import User from "./authModels.js";

// Authenticates using the short-lived access token (header or cookie)
const authenticate = async (req, res, next) => {
  let token;

  // 1. Check Bearer token
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }


  // 2. Check cookie fallback

  
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
   
    
  }




  if (!token) {
  
    
    throw ApiError.unauthorized("Not authenticated");
  }
 
  const decoded = verifyAccessToken(token);

  const user = await User.findById(decoded.id);


  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  req.user = {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  next();
};
// Higher-order function — returns middleware configured with allowed roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        "You do not have permission to perform this action",
      );
    }
    next();
  };
};

export { authenticate, authorize };
