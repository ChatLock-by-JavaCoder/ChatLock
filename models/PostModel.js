const mongoose = require('mongoose');

// Create a schema for posts
const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User model
    required: true,
  },
  content: {
    type: String,
    required: true,  // Content of the post (could be text, or could later be expanded for media like images/videos)
  },
  image: {
    type: String,
    default: '',  // URL or path of the image if there is one (optional)
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Reference to the User who liked the post
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User who commented
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,  // The post creation time
  },
  updatedAt: {
    type: Date,
    default: Date.now,  // Last updated time
  },
});

// Create a virtual field for post like count
postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// Create a virtual field for post comment count
postSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// Update the `updatedAt` field every time a post is modified
postSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Create the Post model from the schema
const Post = mongoose.model('Post', postSchema);

module.exports = Post;
