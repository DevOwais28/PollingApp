import { Poll } from "../models/poll.js"
import { Vote } from "../models/vote.js"
import  Comment from "../models/comment.js"

const addPoll = async (req, res) => {
  try {
    const { description, options, isPrivate, allowedUsers, privateKey } = req.body;
    
    if (options.length < 2) {
      return res.status(400).send({
        success: false,
        error: "At least 2 options are required"
      });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized: Please log in first"
      });
    }

    const poll = new Poll({
        description,
        allowedUsers: isPrivate ? allowedUsers : [],
        isPrivate: isPrivate || false,
        options: Array.isArray(options) ? options.filter(opt => opt && opt.trim()).map(opt => opt.trim()) : [],
        createdBy: req.user.id,
        privateKey: isPrivate ? privateKey : undefined
    });
    
    await poll.save();
    
    const populatedPoll = await Poll.findById(poll._id)
      .populate('createdBy', 'username avatar name');
    
    res.send({
        success: true,
        poll: populatedPoll
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).send({
        success: false,
        error: "Failed to create poll"
    });
  }
};

const deletePoll = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: "Poll ID is required" });
        }
        
        // Delete the poll and its related data in parallel
        await Promise.all([
            Poll.findByIdAndDelete(id),
            Vote.deleteMany({ pollId: id }),
            Comment.deleteMany({ pollId: id })
        ]);
        
        return res.status(200).json({
            success: true,
            message: "Poll deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting poll:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete poll",
            error: error.message
        });
    }
}

const updatePoll = async(req,res)=>{
    try {
        const {description, options} = req.body;
        const {id} = req.params;

        if (!id) return res.status(400).send({error: "Poll ID is required"});
        
        const poll = await Poll.findById(id);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found" });
        }
        
        // Check if the user is the creator of the poll
        if (poll.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized: You can only update your own polls" });
        }
        
        if (description) poll.description = description;
        
        if (options && options.length >= 2) {
            // Extract text from options array of objects and filter out empty options
            const validOptions = options
                .map(opt => (typeof opt === 'string' ? opt.trim() : (opt.text || '').trim()))
                .filter(opt => opt !== '');
                
            if (validOptions.length < 2) {
                return res.status(400).json({ error: "At least 2 valid options are required" });
            }
            
            poll.options = validOptions;
        } else if (options && options.length < 2) {
            return res.status(400).json({ error: "At least 2 options are required" });
        }

        await poll.save();
        
        const updatedPoll = await Poll.findById(poll._id).populate('createdBy', 'username avatar name');

        return res.send({
            success: true,
            message: "Poll updated successfully",
            poll: updatedPoll
        });
    } catch (error) {
        console.error("Error updating poll:", error);
        return res.status(500).send({
            success: false,
            error: error.message || "Failed to update poll"
        });
    }
}

const getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find({isPrivate:false})
      .populate('createdBy', 'username avatar name')
      .sort({ createdAt: -1 });
    
    const pollsWithCreator = polls.map(poll => ({
      ...poll.toObject(),
      createdBy: poll.createdBy || {
        username: 'Anonymous',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
        name: 'Anonymous User'
      }
    }));

    res.send({
      success: true,
      Allpolls: pollsWithCreator
    });
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).send({
      success: false,
      error: "Failed to fetch polls"
    });
  }
};

const joinPrivatePoll = async (req, res) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).send({
        success: false,
        error: "Private key is required"
      });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized: Please log in first"
      });
    }

    const poll = await Poll.findOne({ privateKey })
      .populate('createdBy', 'username avatar name');
    
    if (!poll) {
      return res.status(404).send({
        success: false,
        error: "Invalid or expired private key"
      });
    }

    if (!poll.isPrivate) {
      return res.status(400).send({
        success: false,
        error: "This is not a private poll"
      });
    }

    if (!poll.allowedUsers.includes(req.user.id)) {
      poll.allowedUsers.push(req.user.id);
      await poll.save();
    }

    res.send({
      success: true,
      poll: poll
    });
  } catch (error) {
    console.error("Error joining private poll:", error);
    res.status(500).send({
      success: false,
      error: "Failed to join private poll"
    });
  }
};

const getPollById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).send({
        success: false,
        error: "Poll ID is required"
      });
    }

    const poll = await Poll.findById(id)
      .populate('createdBy', 'username avatar name');
    
    if (!poll) {
      return res.status(404).send({
        success: false,
        error: "Poll not found"
      });
    }

    res.send({
      success: true,
      poll: poll
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).send({
      success: false,
      error: "Failed to fetch poll"
    });
  }
};

const getMyPolls = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).send({
        success: false,
        error: "Unauthorized: Please log in first"
      });
    }

    const polls = await Poll.find({ createdBy: req.user.id })
      .populate('createdBy', 'username avatar name')
      .sort({ createdAt: -1 });
    
    res.send({
      success: true,
      polls: polls
    });
  } catch (error) {
    console.error("Error fetching user polls:", error);
    res.status(500).send({
      success: false,
      error: "Failed to fetch your polls"
    });
  }
};

const getTrendingPolls = async (req, res) => {
  try {
    const { Vote } = await import("../models/vote.js");
    
    // Get polls with vote counts, sorted by most votes (excluding private polls)
    const trendingPolls = await Vote.aggregate([
      {
        $group: {
          _id: "$pollId",
          voteCount: { $sum: 1 }
        }
      },
      {
        $match: {
          voteCount: { $gte: 1 } // Only include polls with at least 1 vote
        }
      },
      {
        $sort: { voteCount: -1 } // Sort by most votes
      },
      {
        $limit: 10 // Get top 10
      },
      {
        $lookup: {
          from: "polls",
          localField: "_id",
          foreignField: "_id",
          as: "poll"
        }
      },
      {
        $unwind: "$poll"
      },
      {
        $match: {
          "poll.isPrivate": { $ne: true } // Exclude private polls
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "poll.createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: "$poll._id",
          description: "$poll.description",
          options: "$poll.options",
          isPrivate: "$poll.isPrivate",
          createdAt: "$poll.createdAt",
          voteCount: 1,
          createdBy: {
            _id: "$createdBy._id",
            username: "$createdBy.username",
            name: "$createdBy.name",
            avatar: "$createdBy.avatar"
          }
        }
      }
    ]);

    res.send({
      success: true,
      trendingPolls: trendingPolls
    });
  } catch (error) {
    console.error("Error fetching trending polls:", error);
    res.status(500).send({
      success: false,
      error: "Failed to fetch trending polls"
    });
  }
};

const getActivePolls = async (req, res) => {
  try {
    const { Vote } = await import("../models/vote.js");
    
    // Get recently created polls with recent activity
    const recentTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const activePolls = await Vote.aggregate([
      {
        $match: {
          createdAt: { $gte: recentTime } // Recent votes only
        }
      },
      {
        $group: {
          _id: "$pollId",
          recentVoteCount: { $sum: 1 },
          lastActivity: { $max: "$createdAt" }
        }
      },
      {
        $match: {
          recentVoteCount: { $gte: 1 } // Only include polls with recent activity
        }
      },
      {
        $sort: { lastActivity: -1 } // Sort by most recent activity
      },
      {
        $limit: 10 // Get top 10
      },
      {
        $lookup: {
          from: "polls",
          localField: "_id",
          foreignField: "_id",
          as: "poll"
        }
      },
      {
        $unwind: "$poll"
      },
      {
        $lookup: {
          from: "users",
          localField: "poll.createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $unwind: {
          path: "$createdBy",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: "$poll._id",
          description: "$poll.description",
          options: "$poll.options",
          isPrivate: "$poll.isPrivate",
          createdAt: "$poll.createdAt",
          recentVoteCount: 1,
          lastActivity: 1,
          createdBy: {
            _id: "$createdBy._id",
            username: "$createdBy.username",
            name: "$createdBy.name",
            avatar: "$createdBy.avatar"
          }
        }
      }
    ]);

    res.send({
      success: true,
      activePolls: activePolls
    });
  } catch (error) {
    console.error("Error fetching active polls:", error);
    res.status(500).send({
      success: false,
      error: "Failed to fetch active polls"
    });
  }
};

const sharePoll = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).send({
        success: false,
        error: "Poll ID is required"
      });
    }

    const poll = await Poll.findById(id)
      .populate('createdBy', 'username avatar name');
    
    if (!poll) {
      return res.status(404).send({
        success: false,
        error: "Poll not found"
      });
    }

    // Generate share data
    const shareData = {
      title: `Vote in this ${poll.isPrivate ? 'private ' : ''}poll: $
      {poll.description}`,
      text: poll.isPrivate
        ? `You've been invited to a private poll: "${poll.description}"\n\nClick the link below to enter the private key and vote!`
        : `Check out this poll: "${poll.description}"\n\nOptions:\n${poll.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}\n\nVote now!`,
      url: shareUrl,
      pollId: id,
      description: poll.description,
      options: poll.options,
      createdBy: poll.createdBy?.username || 'Anonymous',
      isPrivate: poll.isPrivate
    };

    res.status(200).send({
      success: true,
      data: shareData
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
};

export {addPoll,deletePoll,updatePoll,getAllPolls,joinPrivatePoll,getPollById,getMyPolls,getTrendingPolls,getActivePolls,sharePoll};