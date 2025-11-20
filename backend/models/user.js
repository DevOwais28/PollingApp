  
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: {
  type: String,
  allowNull: true, // This field will only be populated for OAuth users
},
  name: {
    type: String,
    required: [true, "Please enter name"],
  },
  email: {
    type: String,
    required: [true, "Please enter email"],
    unique: true,
  },
  password: { 
  type: String, 
  required: function() { 
    return !this.googleId 
  } 
},
  username: {
    type: String,
    unique: true,
    sparse: true, // Allow null values for OAuth users initially
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [20, "Username cannot exceed 20 characters"],
    match: [/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"]
  },
  avatar: {
    type: String,
    default: "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model("User", userSchema);
