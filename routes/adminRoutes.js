import express from "express";
import { registerAdmin, loginAdmin, logoutAdmin } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // ✅ Fix import
import { addMovie } from "../controllers/movieController.js"; // ✅ Import addMovie

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

// ✅ Protect admin dashboard route
router.get("/dashboard", protect, adminOnly, (req, res) => {
    res.json({ message: `Welcome Admin ${req.admin.id}` });
});

// ✅ Protect movie addition route
router.post("/add-movie", protect, adminOnly, addMovie); 

export default router;
