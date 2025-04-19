import express from "express";
import User from "../models/User.js";
import multer from "multer";
import path from "path";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

export const UserRoute = express.Router(); 

// UserRoute.get("/alluser" , isAuthenticated ,async (req,res)=>{
//   const allUsers = await User.find();
// //   res.send(allUsers)

    
// })

