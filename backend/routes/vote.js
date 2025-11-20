import express  from "express"
import { addVote, getVotes, updateVote } from "../controllers/vote.js"
import authenticate from "../middlewares/authentication.js";

const router = express.Router()

router.post("/vote/:pollId" , authenticate, addVote)
router.get("/vote/:pollId" , getVotes)
router.put("/vote/:pollId", authenticate, updateVote)

export default router
