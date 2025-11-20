import express from "express";
import { setupProfile, checkProfileComplete, updateProfile, getProfilesBySearch, changePassword, updateAccountSettings, deleteAccount, getUserProfile, getUserPrivatePolls } from "../controllers/profile.js";
import authenticate from "../middlewares/authentication.js";

const router = express.Router();

// POST /api/profile/setup - Setup profile on first login
router.post("/setup", authenticate, setupProfile);

router.get("/check", authenticate, checkProfileComplete);

// GET /api/profile/search/:searchTerm - Search profiles by username or name
router.get("/search/:searchTerm", authenticate, getProfilesBySearch)

// GET /api/profile/:userId - Get user profile by ID
router.get("/:userId", authenticate, getUserProfile)

// GET /api/profile/:userId/private-polls - Get user's private polls
router.get("/:userId/private-polls", authenticate, getUserPrivatePolls)

// POST /api/profile/change-password - Change user password
router.post("/change-password", authenticate, changePassword)

// PUT /api/profile/account-settings - Update account settings
router.put("/account-settings", authenticate, updateAccountSettings)

router.delete("/delete-account", authenticate, deleteAccount)

// PUT /api/profile/update - Update profile
router.put("/update", authenticate, updateProfile);

export default router;
