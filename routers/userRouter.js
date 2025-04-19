import express from "express";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import Message from "../models/MessageModel.js";

export const userRoute = express.Router();

// Register route (GET)
userRoute.get("/", (req, res) => {
  res.render("auth/register", {
    error: null,
    profilePicUrl: null  // Pass the profilePicUrl to the EJS view if needed
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile_pics/'); // Adjust path for your storage
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Store file with timestamp
  }
});

const upload = multer({ storage });

// Register route (POST)
userRoute.post("/register", upload.single('profilePic'), async (req, res) => {
  const { username, email, password } = req.body;
  let profilePicUrl = null;

  console.log("Form data:", req.body);
  console.log("File data:", req.file);

  if (req.file) {
    profilePicUrl = `/uploads/profile_pics/${req.file.filename}`;
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.render("auth/register", { error: "Email already in use", profilePicUrl });

    const user = new User({ username, email, password, profilePic: profilePicUrl });
    await user.save();
    // After saving the user, render the login page
    res.redirect("/login");
  } catch (err) {
    console.error("Error saving user:", err);
    res.render("auth/register", { error: "Error creating user", profilePicUrl });
  }
});

// Login route (GET)
userRoute.get("/login", (req, res) => {
  res.render("auth/login", {
    error: null
  });
});



// POST route for handling login
userRoute.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email and include password explicitly
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.render('auth/login', {
        error: 'Invalid email or password',
      });
    }

    // Compare provided password with hashed one
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        error: 'Invalid email or password',
      });
    }

    // ✅ Save both userId and user data in session
    req.session.userId = user._id;
    req.session.user = {
      _id: user._id, // Changed `id` to `_id` for consistency
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
    };

    // ✅ Redirect after successful login
    res.redirect('/feed');

  } catch (err) {
    console.error('Login error:', err);
    res.render('auth/login', {
      error: 'Something went wrong. Please try again later.',
    });
  }
});




// Chat route (GET)
userRoute.get("/feed", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    // Fetch messages, populate user info and comments' user info
    const messages = await Message.find()
      .populate("user") // Populate user information for the message
      .populate("comments.user", "username profilePic") // Populate user info for each comment
      .sort({ createdAt: -1 }); // Sort messages to show the latest first

    // Render the feed with the user and messages data

    const allUser =await User.find();
    res.render("auth/chatPages/feed", {
      user: req.session.user, // Current logged-in user
      messages, // Messages with populated user and comments' user info
      alluser:allUser
    });
  } catch (err) {
    console.error("Error loading feed:", err);
    res.status(500).send("Something went wrong");
  }
});



// Logout route (GET)
userRoute.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});
