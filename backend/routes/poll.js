import express  from "express"
import { addPoll, deletePoll, getAllPolls, updatePoll, joinPrivatePoll, getPollById, getMyPolls, getTrendingPolls, getActivePolls, sharePoll } from "../controllers/poll.js"
import  authenticate  from "../middlewares/authentication.js";

const router = express.Router()

router.post("/poll" , authenticate, addPoll)
router.get("/poll" , getAllPolls)
router.get("/my-polls" , authenticate, getMyPolls)
router.get("/trending" , getTrendingPolls)
router.get("/active" , getActivePolls)
router.get("/:id" , getPollById)
router.post("/join-private" , authenticate, joinPrivatePoll)
router.get("/:id/share" , sharePoll)
router.put("/poll/:id", authenticate, updatePoll)
router.delete("/poll/:id", authenticate, deletePoll)

export default router
