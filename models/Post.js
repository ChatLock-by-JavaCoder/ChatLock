// models/Post.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    caption: { type: String },
    tags: { type: String },
    location: { type: String },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'FileUpload' },
    filter: { type: String },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who liked the post
    comments: [commentSchema], // Array of comments (nested)
  },
  { timestamps: true }
);

// module.exports = mongoose.model('Post', postSchema);
export const Post = mongoose.model("Post" ,postSchema)
