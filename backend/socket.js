import { Poll } from "./models/poll.js";
import { Vote } from "./models/vote.js";

export function setupIO(io) {
    io.use(async (socket, next) => {
        try {
            const { pollId, userId } = socket.handshake.query || {};
            
            if (!pollId || !userId) {
                console.error('Missing pollId or userId in handshake');
                return next(new Error("Missing pollId or userId"));
            }
            
            const poll = await Poll.findById(pollId);
            if (!poll) {
                console.error(`Poll not found: ${pollId}`);
                return next(new Error("Poll not found"));
            }

            if (poll.isPrivate) {
                const isAllowed = poll.allowedUsers.includes(userId) || 
                               poll.createdBy.toString() === userId;
                if (!isAllowed) {
                    console.error(`Access denied for user ${userId} to poll ${pollId}`);
                    return next(new Error("Access Denied"));
                }
            }

            socket.poll = poll;
            socket.userId = userId;
            next();
        } catch (error) {
            console.error('Socket middleware error:', error);
            next(error);
        }
    });

    io.on("connection", async (socket) => {
        try {
            const poll = socket.poll;
            const userId = socket.userId;
            const roomId = poll._id.toString();
            
            // User ${userId} connected to poll ${roomId}
            
            // Join the poll room
            await socket.join(roomId);
            // User ${userId} joined room: ${roomId}

            // Send initial poll data
            const votes = await Vote.find({ pollId: poll._id });
            const totalVotes = votes.length;
            
            const results = poll.options.map((option, index) => {
                const optionVotes = votes.filter(v => v.optionIndex === index).length;
                return {
                    option,
                    votes: optionVotes,
                    percentage: totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
                };
            });

            // Send initial results to the newly connected client
            socket.emit('initialResults', { 
                pollId: roomId,
                results,
                totalVotes,
                hasVoted: votes.some(v => v.userId === userId)
            });

            // Handle vote submission
            socket.on('vote', async (data) => {
                try {
                    const { optionIndex } = data;
                    
                    // Check if user already voted
                    const existingVote = await Vote.findOne({ 
                        pollId: poll._id, 
                        userId: userId 
                    });
                    
                    if (existingVote) {
                        return socket.emit('voteError', { 
                            message: "You already voted on this poll" 
                        });
                    }

                    // Create new vote
                    await Vote.create({ 
                        userId, 
                        pollId: poll._id, 
                        optionIndex 
                    });

                    // Get updated votes and results
                    const updatedVotes = await Vote.find({ pollId: poll._id });
                    const updatedTotalVotes = updatedVotes.length;
                    
                    const updatedResults = poll.options.map((option, index) => {
                        const optionVotes = updatedVotes.filter(v => v.optionIndex === index).length;
                        return {
                            option,
                            votes: optionVotes,
                            percentage: updatedTotalVotes > 0 ? (optionVotes / updatedTotalVotes) * 100 : 0
                        };
                    });

                    // Broadcast to all clients in the room
                    const voteData = {
                        pollId: roomId,
                        results: updatedResults,
                        totalVotes: updatedTotalVotes,
                        voterId: userId,
                        voterOptionIndex: optionIndex
                    };

                    // Broadcasting vote:
                    io.to(roomId).emit('vote', voteData);

                } catch (error) {
                    console.error('Error processing vote:', error);
                    socket.emit('voteError', { 
                        message: error.message || 'Failed to process vote' 
                    });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                // User ${userId} disconnected from poll ${roomId}
            });

        } catch (error) {
            console.error('Connection error:', error);
            socket.emit('error', { 
                message: error.message || 'Connection error' 
            });
        }
    });
}