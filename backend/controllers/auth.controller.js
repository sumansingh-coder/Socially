import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    //Invalid Email
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid Email-ID",
      });
    }

    const existingUser = await User.findOne({ username: username });

    //User Already Exist
    if (existingUser) {
      return res.status(400).json({ error: "User Already Exist" });
    }

    const existingEmail = await User.findOne({ email: email });

    //Email Already Exist
    if (existingEmail) {
      return res.status(400).json({ error: "Email Already Taken" });
    }

    //hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName,
      username: username,
      email: email,
      password: hashedPwd,
    });

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
      res.status(200).json({
        newUser,
        message: "User Created Successfully",
      });
    } else {
      res.status(400).json({
        error: "Invalid User Data",
      });
    }
  } catch (error) {
    console.log("Error in Signup Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });

    if (!user) {
      return res.status(400).json({
        error: "Invalid Username",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user?.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        error: "Invalid Password",
      });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      user,
      message: "User Login Successful!",
    });
  } catch (error) {
    console.log("Error in Login Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "User Logged Out" });
  } catch (error) {
    console.log("Error in Logout Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ user, message: "User is authorized!" });
  } catch (error) {
    console.log("Error in getMe Controller : ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
