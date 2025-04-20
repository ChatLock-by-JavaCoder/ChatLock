// --- Required Imports ---
import express from "express";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import hpp from "hpp";
import multer from "multer";
import path from "path";
import http from "http";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server as SocketIo } from "socket.io";
import { userRoute } from "./routers/userRouter.js";
import fs from 'fs';
import { messageRoute } from "./routers/MessageModelRoute.js";

dotenv.config();

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI,)
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// --- App & Server Setup ---
const app = express();
const server = http.createServer(app);
const io = new SocketIo(server);

app.use((req, res, next) => {
  req.io = io; // Provide Socket.IO instance to each request
  next();
});


// --- Middleware ---
// app.use(helmet.contentSecurityPolicy({
//   directives: {
//     defaultSrc: ["'self'"], // Allow self as the default source
//     imgSrc: ["'self'", "https://i.pinimg.com"], // Allow images from self and the external image source
//     scriptSrc: ["'self'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "https://stackpath.bootstrapcdn.com"], // Allow scripts from these sources
//     styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com"], // Allow styles from the external bootstrap source
//     connectSrc: ["'self'"], // For AJAX requests
//     // Add other directives as necessary
//   }
// }));
app.use(hpp());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// app.use(attachUser);


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
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Multer Setup for Profile Pictures ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'profile_pics');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|bmp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) cb(null, true);
  else cb('Error: Only image files are allowed!');
};

const upload = multer({ storage, fileFilter });

// --- File Upload Test Route (Optional) ---
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No file uploaded');
  res.status(200).send({ filePath: `/uploads/profile_pics/${file.filename}` });
});

// --- Socket.IO Chat ---
io.on('connection', (socket) => {
  console.log('✅ A user connected');
  socket.on('chatMessage', (msg) => io.emit('message', msg));
  socket.on('fileUpload', (filePath) => io.emit('fileMessage', filePath));
  socket.on('disconnect', () => console.log('🚪 A user disconnected'));
});




// --- Routes ---
app.use("/", userRoute);
app.use("/message"  ,messageRoute)

// --- Start Server ---
server.listen(8080, () => {
  console.log("🚀 Server is running on port 8080");
});
