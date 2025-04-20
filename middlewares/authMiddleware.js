import User from "../models/User.js";


export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    } else {
      return res.status(401).send("Unauthorized: Please login to continue");
    }
  };
  

  
  export const attachUser = async (req, res, next) => {
    if (req.session && req.session.userId) {
      try {
        const user = await User.findById(req.session.userId);
        if (user) {
          req.user = user;
        }
      } catch (err) {
        console.error("User fetch error:", err);
      }
    }
    next();
  };
  