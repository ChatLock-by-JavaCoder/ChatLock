import express from "express";
import Message from "../models/MessageModel.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import User from "../models/User.js";

export const chatRoute = express.Router();

chatRoute.get("/chat" ,async(req,res)=>{
    const users = await User.find();
    res.render("chat/usermessageshow" ,{users})
})