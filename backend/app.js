import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from 'cors';
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import { setupIO } from "./socket.js";
import passport from "./config/passport.js";
import authenticate from "./middlewares/authentication.js";
import { errorMiddleware } from "./middlewares/error.js";
import { startPollExpiryChecker } from "./jobs/pollExpiryNotifier.js";

// Routes
import pollRoutes from "./routes/poll.js";
import voteRoutes from "./routes/vote.js";
import userRoutes from "./routes/user.js";
import commentRoutes from "./routes/comment.js";
import profileRoutes from "./routes/profile.js";
import notificationRoutes from "./routes/notification.js";
import googleauthRoutes from "./routes/googleAuth.js";

const envMode = process.env.NODE_ENV?.trim() || 'DEVELOPMENT';
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/PollingApp';

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});
setupIO(io);

// Connect DB
connectDB(mongoURI).then(() => {
  // Connected to DB
  startPollExpiryChecker(); // Start the expiry checker
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: envMode !== "DEVELOPMENT",
  crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Routes
app.get('/', (req, res) => res.send("Hello World"));
app.use(passport.initialize());

app.use("/api/auth", googleauthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/polls", authenticate, pollRoutes);
app.use("/api/votes", authenticate, voteRoutes);
app.use("/api/comments", authenticate, commentRoutes);
app.use("/api/profile", authenticate, profileRoutes);
app.use("/api/notifications", authenticate, notificationRoutes);

// Error handler
app.use(errorMiddleware);

// 🚀 Start the correct server (Express + Socket.IO)
server.listen(port, () => {
  // Server is working on Port: ${port} in ${envMode} Mode.
});
