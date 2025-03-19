import jwt from "jsonwebtoken";
import User from "../models/userModel.js";  

export const userAuth = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];  
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  
            req.user = await User.findById(decoded.id).select("-password");  

            // Ensure user is an admin
            if (req.user.role !== "admin") {
                return res.status(403).json({ message: "Access denied. Admins only." });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};
