import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";

// ✅ Protect middleware for both users and admins
export const protect = async (req, res, next) => {
    try {
        let token = req.cookies?.token; // Get token from cookies

        // Also allow Bearer Token from Authorization headers
        if (!token && req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        // ✅ Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        // ✅ Check if user or admin exists
        let user = await User.findById(decoded.id).select("-password");
        if (!user) {
            user = await Admin.findById(decoded.id).select("-password");
        }

        if (!user) {
            return res.status(401).json({ message: "User/Admin not found, not authorized" });
        }

        req.user = user; // Attach user data to request
        next();
    } catch (error) {
        console.error("Auth Error:", error);
        res.status(401).json({ message: "Not authorized", error: error.message });
    }
};

// ✅ Admin-only access middleware
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};
