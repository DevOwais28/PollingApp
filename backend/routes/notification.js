import express from "express";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  getUnreadCount 
} from "../controllers/notification.js";
import authenticate from "../middlewares/authentication.js";

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get("/", authenticate, getNotifications);

// GET /api/notifications/unread-count - Get unread notifications count
router.get("/unread-count", authenticate, getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put("/:notificationId/read", authenticate, markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", authenticate, markAllAsRead);

router.delete("/:notificationId", authenticate, deleteNotification);

export default router;
