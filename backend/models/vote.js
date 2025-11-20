import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pollId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll',
        required: true
    },
    optionIndex:
    {
        type: Number,
        required: true
    } // index of selected option
});

voteSchema.index({ userId: 1, pollId: 1 }, { unique: true }); // prevent double voting
// voteSchema.index({pollId: 1} , {expireAfterSeconds:0})
export const Vote = mongoose.model('Vote', voteSchema);
