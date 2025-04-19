import express from "express";
import User from "../models/User.js";
import multer from "multer";
import path from "path";

export const userPostRoute = express.Router(); 

const createPost = async (userId, content, imageUrl) => {
    const newPost = new Post({
      user: userId,
      content: content,
      image: imageUrl,
    });
  
    await newPost.save();
    console.log('Post created:', newPost);
  };


  