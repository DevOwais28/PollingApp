import { Notification } from "../models/notification.js";
import { User } from "../models/user.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'username name avatar')
      .populate('relatedPoll', 'description')
      .populate('relatedComment', 'text')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.json({
      success: true,
      notifications,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      unreadCount
    });
    
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications"
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        recipient: userId 
      },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    res.json({
      success: true,
      message: "Notification marked as read"
    });
    
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking notification as read"
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      { 
        recipient: userId, 
        isRead: false 
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: "All notifications marked as read"
    });
    
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking all notifications as read"
    });
  }
};

export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    
    // Populate sender and related data before returning
    await notification.populate('sender', 'username name avatar');
    if (data.relatedPoll) {
      await notification.populate('relatedPoll', 'description');
    }
    if (data.relatedComment) {
      await notification.populate('relatedComment', 'text');
    }
    
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    throw error;
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    res.json({
      success: true,
      message: "Notification deleted"
    });
    
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting notification"
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.json({
      success: true,
      unreadCount
    });
    
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching unread count"
    });
  }
};
