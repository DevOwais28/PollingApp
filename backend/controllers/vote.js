import { Vote } from "../models/vote.js"
import { Poll } from "../models/poll.js"
import { createNotification } from "./notification.js"

const addVote = async (req, res) => {
    try {
        const { optionIndex } = req.body
        const { pollId } = req.params
        
        // Vote attempt:
        
        // Validation
        if (optionIndex === undefined || optionIndex === null) {
            return res.status(400).json({
                success: false,
                message: "You must provide an option index to vote"
            });
        }

        if (!pollId) {
            return res.status(400).json({
                success: false,
                message: "Poll ID is required"
            });
        }

        if (!req.user || !req.user.id) {
            // Authentication failed - req.user:
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Use the user ID from the JWT token
        const userId = req.user.id;
        if (!userId) {
            // No user ID found in req.user:
            return res.status(401).json({
                success: false,
                message: "User ID not found in token"
            });
        }

        // Check if poll exists
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: "Poll not found"
            });
        }

        // Validate option index
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({
                success: false,
                message: "Invalid option index"
            });
        }

        // Check if user already voted
        const existingVote = await Vote.findOne({
            userId: userId,
            pollId: pollId
        });

        if (existingVote) {
            // User already voted:
            return res.status(400).json({
                success: false,
                message: "You have already voted on this poll"
            });
        }

        // Create new vote
        const vote = new Vote({
            userId: userId,
            pollId: pollId,
            optionIndex
        });

        // Creating vote with data:
        const voteData = {
            userId: userId,
            userIdType: typeof userId,
            pollId: pollId,
            pollIdType: typeof pollId,
            optionIndex: optionIndex
        };
        
        await vote.validate();
        const savedVote = await vote.save();
        // Vote saved successfully:

        // Create notification for poll owner (if not voting on own poll)
        if (poll.createdBy.toString() !== userId) {
            try {
                await createNotification({
                    recipient: poll.createdBy,
                    sender: userId,
                    type: 'poll_vote',
                    title: 'New Vote on Your Poll',
                    message: `${req.user.name || req.user.username} voted on your poll "${poll.description}"`,
                    relatedPoll: pollId
                });
            } catch (notificationError) {
                console.error('Failed to create notification:', notificationError);
                // Don't fail the vote if notification fails
            }
        }

        return res.status(201).json({
            success: true,
            message: "Vote added successfully",
            vote
        });
        
    } catch (err) {
        console.error('Vote submission error:', err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: Object.values(err.errors).map(e => e.message)
            });
        }
        
        // Handle duplicate key error (already voted)
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already voted on this poll"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Failed to submit vote. Please try again."
        });
    }
}

const updateVote = async (req, res) => {
    try {
        const { optionIndex } = req.body
        const { pollId } = req.params

        if (!optionIndex) return res.send({ error: "you have to provide index to vote" })

        if (!pollId) return res.send({ error: "poll doesnt exist" })

        if (!req.user)
            return res.status(401).json({ error: "Unauthorized: Please log in first" });

        // if poll exists
        const poll = await Poll.findById(pollId)
        if (!poll) return res.send({ error: "Poll not found" });

        // if user has voted in poll
        const existingVote = await Vote.findOne({
            user: req.user.id,
            pollId,
        });

        if (!existingVote) return res.send({ error: "You haven't voted on this poll yet" });

        existingVote.optionIndex = optionIndex
        await existingVote.validate()
        await existingVote.save()
        return res.send({
            message: "Vote updated Successfully"
        })
    } catch (err) {
        return res.send({
            error: err
        })
    }
}
const getVotes = async (req, res) => {
  try {
    const votes = await Vote.find({pollId: req.params.pollId})
    // const votes = await Vote.aggregate([
    //   {
    //     $group: {
    //       _id: { poll: "$pollId", option: "$option" },
    //       count: { $sum: 1 }
    //     }
    //   },
    //   {
    //     $group: {
    //       _id: "$_id.poll",
    //       options: {
    //         $push: {
    //           option: "$_id.option",
    //           votes: "$count"
    //         }
    //       }
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: "polls",
    //       localField: "_id",
    //       foreignField: "_id",
    //       as: "poll"
    //     }
    //   },
    //   {
    //     $unwind: "$poll"
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       description: "$poll.description",
    //       options: 1
    //     }
    //   }
    // ]);

    // if (!votes.length) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No votes found.",
    //   });
    // }

    res.json({
      success: true,
      // message: "Votes aggregated by option",
      votes,
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



const checkUserVote = async (req, res) => {
  try {
    const { userId, pollId } = req.params
    
    if (!userId || !pollId) {
      return res.status(400).json({
        success: false,
        error: "User ID and Poll ID are required"
      });
    }

    const existingVote = await Vote.findOne({
      user: userId,
      pollId: pollId,
    });

    res.json({
      success: true,
      hasVoted: !!existingVote,
      vote: existingVote
    });
  } catch (error) {
    console.error("Error checking user vote:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export { addVote, updateVote, getVotes }


// Absolutely! Let’s break the aggregation pipeline **step by step** so you can see exactly what it does and why each stage is necessary. I’ll also explain how the data flows and is transformed.

// We are using this pipeline:

// ```js
// const votes = await Vote.aggregate([
//   {
//     $group: {
//       _id: { poll: "$pollId", option: "$option" },
//       count: { $sum: 1 }
//     }
//   },
//   {
//     $group: {
//       _id: "$_id.poll",
//       options: {
//         $push: {
//           option: "$_id.option",
//           votes: "$count"
//         }
//       }
//     }
//   },
//   {
//     $lookup: {
//       from: "polls",
//       localField: "_id",
//       foreignField: "_id",
//       as: "poll"
//     }
//   },
//   {
//     $unwind: "$poll"
//   },
//   {
//     $project: {
//       _id: 1,
//       description: "$poll.description",
//       options: 1
//     }
//   }
// ]);
// ```

// ---

// ### **Stage 1 — `$group` by poll and option**

// ```js
// {
//   $group: {
//     _id: { poll: "$pollId", option: "$option" },
//     count: { $sum: 1 }
//   }
// }
// ```

// **What it does:**

// * Groups all votes by the poll they belong to (`pollId`) **and the option voted** (`option`).
// * For each group, it counts how many votes are in that group using `count: { $sum: 1 }`.

// **Example input (Vote collection):**

// ```json
// [
//   { "pollId": "1", "option": "A" },
//   { "pollId": "1", "option": "A" },
//   { "pollId": "1", "option": "B" },
//   { "pollId": "2", "option": "C" }
// ]
// ```

// **After this stage:**

// ```json
// [
//   { "_id": { "poll": "1", "option": "A" }, "count": 2 },
//   { "_id": { "poll": "1", "option": "B" }, "count": 1 },
//   { "_id": { "poll": "2", "option": "C" }, "count": 1 }
// ]
// ```

// ---

// ### **Stage 2 — `$group` by poll only**

// ```js
// {
//   $group: {
//     _id: "$_id.poll",
//     options: {
//       $push: {
//         option: "$_id.option",
//         votes: "$count"
//       }
//     }
//   }
// }
// ```

// **What it does:**

// * Now we **group votes by poll only** (ignoring individual options).
// * For each poll, we create an **array of option objects**, each containing the option text and its vote count.

// **After this stage:**

// ```json
// [
//   {
//     "_id": "1",
//     "options": [
//       { "option": "A", "votes": 2 },
//       { "option": "B", "votes": 1 }
//     ]
//   },
//   {
//     "_id": "2",
//     "options": [
//       { "option": "C", "votes": 1 }
//     ]
//   }
// ]
// ```

// ---

// ### **Stage 3 — `$lookup` to get poll details**

// ```js
// {
//   $lookup: {
//     from: "polls",
//     localField: "_id",
//     foreignField: "_id",
//     as: "poll"
//   }
// }
// ```

// **What it does:**

// * Joins the aggregated votes with the `Poll` collection to fetch details about the poll (like the `description`).
// * `localField: "_id"` → the poll ID from our aggregation.
// * `foreignField: "_id"` → the `_id` in the `Poll` collection.
// * `as: "poll"` → stores the joined poll document in an array called `poll`.

// **After this stage:**

// ```json
// [
//   {
//     "_id": "1",
//     "options": [
//       { "option": "A", "votes": 2 },
//       { "option": "B", "votes": 1 }
//     ],
//     "poll": [
//       { "_id": "1", "description": "Who is better?" }
//     ]
//   }
// ]
// ```

// ---

// ### **Stage 4 — `$unwind` poll**

// ```js
// {
//   $unwind: "$poll"
// }
// ```

// **What it does:**

// * Converts the `poll` array into a single object (because `$lookup` always returns an array).
// * This makes it easier to access poll fields like `description`.

// **After this stage:**

// ```json
// [
//   {
//     "_id": "1",
//     "options": [
//       { "option": "A", "votes": 2 },
//       { "option": "B", "votes": 1 }
//     ],
//     "poll": { "_id": "1", "description": "Who is better?" }
//   }
// ]
// ```

// ---

// ### **Stage 5 — `$project` to format output**

// ```js
// {
//   $project: {
//     _id: 1,
//     description: "$poll.description",
//     options: 1
//   }
// }
// ```

// **What it does:**

// * Selects the fields you want in the final output:

//   * `_id` → poll ID
//   * `description` → poll question
//   * `options` → array of options with vote counts

// **Final output:**

// ```json
// [
//   {
//     "_id": "1",
//     "description": "Who is better?",
//     "options": [
//       { "option": "A", "votes": 2 },
//       { "option": "B", "votes": 1 }
//     ]
//   }
// ]
// ```

// ✅ **Why it’s useful:**

// * You can now send this to your frontend and **render each poll with its options and vote counts**.
// * It handles multiple polls and multiple options automatically.

// ---

// If you want, I can also **rewrite your SocialCard frontend** so it consumes this aggregated data and **shows live vote counts per option** without extra work.

// Do you want me to do that next?
