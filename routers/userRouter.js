// userRoute.js
import express from "express";

import Message from "../models/MessageModel.js";
import User from "../models/User.js";
import cloudinary from "../middlewares/cloudnary.js";
import getDataUri from "../middlewares/datauri.js";
import multer from "multer";





export const userRoute = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });






// ✅ Register route (GET)
userRoute.get("/", (req, res) => {
  res.render("auth/register", {
    error: null,
    profilePicUrl: null,
  });
});

userRoute.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {


    const exists = await User.findOne({ email });
    if (exists) {
      return res.render("auth/register", {
        error: "Email already in use",
      });
    }


    const user = new User({
      username,
      email,
      password,
    });

    await user.save();
    // res.send(user)
    res.redirect("/login");

  } catch (err) {
    console.error("🔥 Error saving user:", err);
    res.render("auth/register", {
      error: "Registration failed. Please try again.",
    });
  }
});


userRoute.get("/user/edit/profile", async(req, res) => {

  const userId = req.session.userId;
const user =  await User.findById(userId).select('-password');
  res.render("auth/chatPages/editProfile" ,{user})
})








userRoute.post("/user/edit", upload.single("profilePic"), async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) return res.status(401).send("Unauthorized");

    const profilePic = req.file;
    console.log("Received file:", profilePic); // Debug line

    let cloudResponse;
    if (profilePic) {
      const fileUri = getDataUri(profilePic);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    if (cloudResponse?.secure_url) {
      user.profilePic = cloudResponse.secure_url;
    }

    await user.save();
    res.redirect("/feed");
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("Server error");
  }
});



// ✅ Login route (GET)
userRoute.get("/login", (req, res) => {
  res.render("auth/login", {
    error: null,
  });
});

// ✅ Login route (POST)
userRoute.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.render("auth/login", {
        error: "Invalid email or password",
      });
    }

    req.session.userId = user._id;
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
    };

    res.redirect("/feed");
  } catch (err) {
    console.error("🚫 Login error:", err);
    res.render("auth/login", {
      error: "Something went wrong. Please try again.",
    });
  }
});

// ✅ Feed route (GET)
userRoute.get("/feed", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const messages = await Message.find()
      .populate("user")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 });

    const allUser = await User.find();

    res.render("auth/chatPages/feed", {
      user: req.session.user,
      messages,
      alluser: allUser,
    });
  } catch (err) {
    console.error("❌ Error loading feed:", err);
    res.status(500).send("Something went wrong");
  }
});

// ✅ Logout route
userRoute.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});
