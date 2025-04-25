import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import hpp from "hpp";
import mongoose from "mongoose";
import http from "http";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server as SocketIo } from "socket.io";

// Routes
import { userRoute } from "./routers/userRouter.js";
import { messageRoute } from "./routers/MessageModelRoute.js";
import { chatRoute } from "./routers/ChatRouter.js";

dotenv.config();

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const app = express();
const server = http.createServer(app);
const io = new SocketIo(server);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(hpp());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Session Setup ---
app.use(session({
  secret: process.env.MYSECREAREKEY,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: false, // Change to true in production with HTTPS
    httpOnly: true
  }
}));

// --- Static Directories ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('✅ A user connected');
  
  socket.on('chatMessage', (msg) => io.emit('message', msg));
  socket.on('fileUpload', (filePath) => io.emit('fileMessage', filePath));
  socket.on('disconnect', () => console.log('🚪 A user disconnected'));
});

// --- Routes ---
app.use("/", userRoute);
app.use("/message", messageRoute);
app.use("/users" , chatRoute)

// --- Start Server ---
server.listen(8080, () => {
  console.log("🚀 Server is running on port 8080");
});
