import express from "express";
import Message from "../models/MessageModel.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

export const messageRoute = express.Router();

// POST: Post a new message
messageRoute.post("/post", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const content = req.body.message;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Create the new message in the database
    const newMessage = await Message.create({
      user: userId,
      content: content.trim(),
    });

    // Emit the new message to all connected clients using Socket.IO
    req.io.emit('newMessage', newMessage);

    // Redirect to the feed
    res.redirect("/feed");
  } catch (err) {
    console.error("Error posting message:", err);
    res.status(500).send("Something went wrong");
  }
});

// POST: Like or unlike a message
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

    // Emit the updated message to all connected clients via Socket.IO
    req.io.emit('likeUpdated', message);

    res.redirect("/feed");
  } catch (err) {
    console.error("Error liking message:", err);
    res.status(500).send("Something went wrong");
  }
});

// POST: Add a comment to a message
messageRoute.post("/comment/:messageId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { messageId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).send("Comment cannot be empty");
    }

    const message = await Message.findById(messageId).populate('comments.user', 'username profilePic');
    if (!message) return res.status(404).send("Message not found");

    // Add the new comment to the message
    message.comments.push({
      user: userId,
      content: comment.trim(),
    });

    await message.save();

    // Emit the updated message with new comment to all connected clients
    req.io.emit('newComment', message);

    res.redirect("/feed");
  } catch (err) {
    console.error("Error commenting on message:", err);
    res.status(500).send("Something went wrong");
  }
});

// POST: Delete a message
messageRoute.post("/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.session.userId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).send("Message not found");

    if (message.user.toString() !== userId) {
      return res.status(403).send("You can only delete your own messages");
    }

    // Delete the message
    await message.deleteOne();

    // Emit the delete action to all connected clients via Socket.IO
    req.io.emit('messageDeleted', messageId);

    res.redirect("/feed");
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).send("Something went wrong");
  }
});

// POST: Delete a comment on a message
messageRoute.post("/comment/delete/:messageId/:commentId", isAuthenticated, async (req, res) => {
  try {
    const { messageId, commentId } = req.params;
    const userId = req.session.userId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).send("Message not found");

    const comment = message.comments.id(commentId);
    if (!comment) return res.status(404).send("Comment not found");

    if (comment.user.toString() !== userId) {
      return res.status(403).send("You can only delete your own comments");
    }

    // Remove the comment from the message
    message.comments.pull(commentId);

    await message.save();

    // Emit the updated message with deleted comment to all clients via Socket.IO
    req.io.emit('commentDeleted', { messageId, commentId });

    res.redirect("/feed");
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).send("Something went wrong");
  }
});
