import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const secret = process.env.JWT_SECRET;
import { User } from "../models/user.js";

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const isUserExist = await User.findOne({ email: email });
    
    if (isUserExist) {
      return res.status(400).send({
        success: false,
        message: `User already exists with this email`,
      });
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userObj = {
      name,
      email,
      password: hashedPassword,
    };
    
    const newUser = await User.create(userObj);
    
    
    return res.status(201).send({
      success: true,
      message: `User created successfully`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }  
    });
    
  } catch (error) {
    console.error('Error in createUser:', error);
    return res.status(500).send({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// User sign in
const signinUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    
    if (!passwordMatched) {
      return res.status(401).send({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: '1d' }
    );

    // Remove password from response
    user.password = undefined;
    
    return res.status(200).send({
      success: true,
      message: 'Login successful',
      user,
      token,
    });
    
  } catch (error) {
    console.error('Error in signinUser:', error);
    return res.status(500).send({
      success: false,
      message: 'Error during sign in',
      error: error.message
    });
  }
};

export { createUser, signinUser };
