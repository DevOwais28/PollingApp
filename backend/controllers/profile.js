import { User } from "../models/user.js";
import { Poll } from "../models/poll.js";
import { Vote } from "../models/vote.js";
import Comment from "../models/comment.js";
import bcrypt from "bcrypt";
import { createNotification } from "./notification.js";

// Setup profile on first login
export const setupProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const userId = req.user.id;
    
    // Validate username
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long"
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Username already taken"
      });
    }

    // Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      {
        username,
        avatar: avatar || undefined,
        isProfileComplete: true
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile setup completed successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error("Profile setup error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile setup"
    });
  }
};

// Check if profile is complete
export const checkProfileComplete = async (req, res) => {
  try {
    // User object:
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      isProfileComplete: user.isProfileComplete,
      username: user.username,
      avatar: user.avatar,
      _id: user._id
    });
  } catch (error) {
    console.error("Check profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get current user's profile data

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const userId = req.user.id;

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).json({
          success: false,
          message: "Username already taken"
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(username && { username }),
        ...(avatar && { avatar }),
        isProfileComplete: true
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update"
    });
  }
};

export const changePassword = async(req,res) =>{
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user and include password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({
      success: true,
      message: "Password changed successfully"
    });
     
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password change"
    });
  }
};

export const updateAccountSettings = async(req,res) =>{
  try {
    const { email, name, username } = req.body;
    const userId = req.user.id;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username: username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken"
        });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken"
        });
      }
    }

    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { 
        ...(email && { email }),
        ...(name && { name }),
        ...(username && { username })
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Account settings updated successfully",
      user: updatedUser
    });
     
  } catch (error) {
    console.error("Update account settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during settings update"
    });
  }
};

export const deleteAccount = async(req,res) =>{
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Find user and include password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Skip password verification for Google-authenticated users
    if (!user.googleId) {
      // Only verify password for non-Google users
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required for account deletion"
        });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Password is incorrect"
        });
      }
    }

    // Delete user's polls
    await Poll.deleteMany({ createdBy: userId });
    
    // Delete user's votes
    await Vote.deleteMany({ userId: userId });
    
    // Delete user's comments
    await Comment.deleteMany({ userId: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account deleted successfully"
    });
     
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during account deletion"
    });
  }
};

export const getProfilesBySearch = async(req,res) =>{
  try {
    const {searchTerm} = req.params
    const users = await User.find({
      $or: [
        { username: { $regex: searchTerm, $options: "i" } },
        { name: { $regex: searchTerm, $options: "i" } }
      ]
    }).limit(20) // Limit results to prevent too many responses
    
    res.json({
      success: true,
      users
    })
     
  } catch (error) {
    console.error("Get profiles by search error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile retrieval"
    });
  }
}

export const getUserProfile = async(req,res) =>{
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Create notification for profile visit (if not visiting own profile)
    if (userId !== currentUserId.toString()) {
      try {
        await createNotification({
          recipient: userId,
          sender: currentUserId,
          type: 'profile_visit',
          title: 'Profile Visit',
          message: `${req.user.name || req.user.username} visited your profile`,
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the profile view if notification fails
      }
    }

    res.json({
      success: true,
      user
    });
     
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile retrieval"
    });
  }
}

export const getUserPrivatePolls = async(req,res) =>{
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    
    // Only allow users to see their own private polls
    if (userId !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own private polls"
      });
    }
    
    const { Poll } = await import("../models/poll.js");
    
    const privatePolls = await Poll.find({ 
      createdBy: userId,
      isPrivate: true 
    })
    .populate('createdBy', 'username name avatar')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      polls: privatePolls
    });
     
  } catch (error) {
    console.error("Get user private polls error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during private polls retrieval"
    });
  }
}