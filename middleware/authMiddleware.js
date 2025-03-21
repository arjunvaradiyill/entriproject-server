import User from "../models/User.js";

export const protect = async (req, res, next) => {
    const userId = req.cookies.auth;

    if (!userId) {
        return res.status(401).json({ message: "Not authorized, no cookie found" });
    }

    try {
        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });

        req.user = user; // Attach user to request
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized" });
    }
};
