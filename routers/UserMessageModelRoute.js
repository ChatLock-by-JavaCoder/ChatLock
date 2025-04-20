



import express from "express";

import { isAuthenticated } from "../middlewares/authMiddleware.js";
import Message from "../models/Message.js"
import { upload } from "../middlewares/uploadMiddleware.js";




export const UsermessageRoute = express.Router();


UsermessageRoute.get("/feed/post/create" , isAuthenticated ,(req,res)=>{
    if (!req.session.user) return res.redirect("/login");
    res.render("auth/chatPages/fileMessage", {
        user: req.session.user, // Current logged-in user
    
      });
})

// routers/MessageModelRoute.js

UsermessageRoute.post(
    "/feed/message/post",
    isAuthenticated,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "reel", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const userId = req.session.userId;
            const content = req.body.message?.trim();

            if (!content && !req.files?.image && !req.files?.video && !req.files?.reel) {
                return res.status(400).json({ message: "Message content or media required" });
            }

            const newMessage = await Message.create({
                user: userId,
                content,
                image: req.files?.image?.[0]?.filename,
                video: req.files?.video?.[0]?.filename,
                reel: req.files?.reel?.[0]?.filename,
            });

            res.redirect("/feed");
        } catch (err) {
            console.error("Error posting message:", err);
            res.status(500).send("Something went wrong");
        }
    }
);




// routers/MessageModelRoute.js
UsermessageRoute.post("/message/:id/like", isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const message = await Message.findById(req.params.id);

        if (!message) return res.status(404).send("Message not found");

        const isLiked = message.likes.includes(userId);
        if (isLiked) {
            // Unlike
            message.likes = message.likes.filter((id) => id.toString() !== userId);
        } else {
            // Like
            message.likes.push(userId);
        }

        await message.save();
        res.redirect("/feed");
    } catch (err) {
        console.error("Like error:", err);
        res.status(500).send("Something went wrong");
    }
});
