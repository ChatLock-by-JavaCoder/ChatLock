import express from "express";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import Message from "../models/MessageModel.js"
import {  isAuthenticated } from "../middlewares/authMiddleware.js";


export const messageRoute = express.Router(); 

messageRoute.post("/post", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const content = req.body.message;
      console.log("Session userId:", req.session.userId);

  
      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Message content is required" });
      }
  
      const newMessage = await Message.create({
        user: userId,
        content: content.trim(),
      });
  
      // res.send(userId)
      res.redirect("/feed" ); // or render updated feed if using EJS
    } catch (err) {
      console.error("Error posting message:", err);
      res.status(500).send("Something went wrong");
    }
  });
  
  messageRoute.post("/like/:messageId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { messageId } = req.params;
  
      const message = await Message.findById(messageId);
      if (!message) return res.status(404).send("Message not found");
  
      const liked = message.likes.includes(userId);
  
      if (liked) {
        message.likes.pull(userId); // Unlike
      } else {
        message.likes.push(userId); // Like
      }
  
      await message.save();
      res.redirect("/feed");
    } catch (err) {
      console.error("Error liking message:", err);
      res.status(500).send("Something went wrong");
    }
  });
  
  // ✅ POST: Add a comment to a message
  messageRoute.post("/comment/:messageId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { messageId } = req.params;
      const { comment } = req.body;
  
      // Validate the comment
      if (!comment || comment.trim() === "") {
        return res.status(400).send("Comment cannot be empty");
      }
  
      // Find the message and populate the user details for comments
      const message = await Message.findById(messageId).populate('comments.user', 'username profilePic');
      if (!message) return res.status(404).send("Message not found");
  
      // Add the comment to the message
      message.comments.push({
        user: userId,
        content: comment.trim(),
      });
  
      // Save the updated message
      await message.save();
  
      // Redirect back to feed or render with updated comments
      res.redirect("/feed");  // Or render the updated feed with populated data
    } catch (err) {
      console.error("Error commenting on message:", err);
      res.status(500).send("Something went wrong");
    }
  });
  
  
  

  messageRoute.post("/delete/:id", isAuthenticated, async (req, res) => {
    try {
      const messageId = req.params.id;
      const userId = req.session.userId;
  
      // Find the message
      const message = await Message.findById(messageId);
  
      // Check if the message exists
      if (!message) {
        return res.status(404).send("Message not found");
      }
  
      // Check if the user is the owner of the message
      if (message.user.toString() !== userId) {
        return res.status(403).send("You can only delete your own messages");
      }
  
      // Delete the message
      await message.deleteOne();
  
      // Redirect or send success response
      res.redirect("/feed"); // or res.send({ message: "Deleted successfully" });
    } catch (err) {
      console.error("Error deleting message:", err);
      res.status(500).send("Something went wrong");
    }
  });

  messageRoute.post("/comment/delete/:messageId/:commentId", isAuthenticated, async (req, res) => {
    try {
      const { messageId, commentId } = req.params;
      const userId = req.session.userId;
  
      console.log("Message ID:", messageId);
      console.log("Comment ID:", commentId);
      console.log("User ID:", userId);
  
      // Find the message by its ID
      const message = await Message.findById(messageId);
  
      // Check if the message exists
      if (!message) {
        console.log("Message not found");
        return res.status(404).send("Message not found");
      }
  
      // Find the comment in the comments array by its ID
      const comment = message.comments.id(commentId);
  
      // Check if the comment exists
      if (!comment) {
        console.log("Comment not found");
        return res.status(404).send("Comment not found");
      }
  
      // Check if the user is the author of the comment
      if (comment.user.toString() !== userId) {
        console.log("User is not the author of the comment");
        return res.status(403).send("You can only delete your own comments");
      }
  
      // Remove the comment from the comments array
      message.comments.pull(commentId);
  
      // Save the updated message
      await message.save();
  
      console.log("Comment deleted successfully");
  
      // Redirect back to the feed or send success message
      res.redirect("/feed"); // or res.send({ message: "Comment deleted successfully" });
    } catch (err) {
      console.error("Error deleting comment:", err);
      res.status(500).send("Something went wrong");
    }
  });
  