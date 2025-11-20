import mongoose from "mongoose";
import { Vote } from "./vote.js";

const pollSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true
    },
    allowedUsers: {
        type: []
    },
    options: {
        type: [String],
        required: [true, "Options are required"],
        validate: {
            validator: function(options) {
                return options.length >= 2;
            },
            message: "At least 2 options are required"
        }
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    privateKey: {
        type: String,
        required: function () {
            return this.isPrivate === true;
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required:true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    expiryDuration: {
        type: String,
        required: true,
        enum: ['24 hours', '3 days', '5 days', '7 days'],
        default: '24 hours'
    },
    expiresAt: {
        type: Date,
        required: true,
        default: function() {
            const duration = this.expiryDuration || '24 hours';
            const durationMap = {
                '24 hours': 24 * 60 * 60 * 1000,
                '3 days': 3 * 24 * 60 * 60 * 1000,
                '5 days': 5 * 24 * 60 * 60 * 1000,
                '7 days': 7 * 24 * 60 * 60 * 1000
            };
            return new Date(Date.now() + durationMap[duration]);
        }
    },
    lastExpiryNotification: {
        type: Date,
        default: null
    },
    lastDailyNotification: {
        type: Date,
        default: null
    }
});

export const Poll = mongoose.model("Poll", pollSchema);

// TTL index to automatically delete expired polls
pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });