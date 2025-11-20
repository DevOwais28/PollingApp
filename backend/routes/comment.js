import express from "express";
import { addComment, getComments, updateComment, deleteComment } from "../controllers/comment.js";
import authenticate from "../middlewares/authentication.js";

const router = express.Router();

// POST /api/comments/:pollId - Add a comment to a poll
router.post("/comment/:pollId", addComment);
// GET /api/comments/:pollId - Get all comments for a poll
router.get("/comment/:pollId", getComments);

// PUT /api/comments/:id - Update a comment
router.put("/comment/:id", updateComment);

router.delete("/comment/:id", deleteComment);

export default router;
