import { Poll } from '../models/poll.js';
import { Vote } from '../models/vote.js';
import { User } from '../models/user.js';
import { createNotification } from '../controllers/notification.js';

// Check for polls expiring in the next hour and send notifications
export const checkExpiringPolls = async () => {
  try {
    // Checking for expiring polls...
    
    // Find polls that will expire in the next hour (between now and 1 hour from now)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    const expiringPolls = await Poll.find({
      expiresAt: {
        $gte: now,
        $lte: oneHourFromNow
      },
      // Only check polls that haven't had expiry notifications sent in the last hour
      $or: [
        { lastExpiryNotification: { $exists: false } },
        { lastExpiryNotification: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } }
      ]
    }).populate('createdBy', '_id username');
    
    // Found ${expiringPolls.length} polls expiring soon
    
    for (const poll of expiringPolls) {
      // Get all voters for this poll
      const votes = await Vote.find({ pollId: poll._id }).distinct('userId');
      
      // Add poll owner if not already included
      const allRecipients = new Set(votes);
      if (poll.createdBy) {
        allRecipients.add(poll.createdBy._id);
      }
      
      // Send notification to all recipients
      const notificationPromises = Array.from(allRecipients).map(async (recipientId) => {
        const isOwner = poll.createdBy && recipientId.toString() === poll.createdBy._id.toString();
        const message = isOwner 
          ? `Your poll "${poll.description.substring(0, 50)}${poll.description.length > 50 ? '...' : ''}" will expire in 1 hour. View or download results before it expires.`
          : `A poll you voted on will expire in 1 hour. View the results before it expires.`;
        
        await createNotification({
          recipient: recipientId,
          sender: recipientId, // Self notification
          type: 'poll_expiry',
          title: 'Poll Expiring Soon',
          message: message,
          relatedPoll: poll._id
        });
      });
      
      await Promise.all(notificationPromises);
      
      // Update the last notification time
      await Poll.findByIdAndUpdate(poll._id, {
        lastExpiryNotification: now
      });
      
      // Sent expiry notification for poll: ${poll._id} to ${allRecipients.size} recipients
    }
    
    // Also check for polls expiring in the next 24 hours (send daily reminder)
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const pollsExpiringTomorrow = await Poll.find({
      expiresAt: {
        $gte: oneHourFromNow,
        $lte: twentyFourHoursFromNow
      },
      // Only check polls that haven't had daily notifications sent today
      $or: [
        { lastDailyNotification: { $exists: false } },
        { lastDailyNotification: { $lt: new Date(now.setHours(0, 0, 0, 0)) } }
      ]
    }).populate('createdBy', '_id username');
    
    // Found ${pollsExpiringTomorrow.length} polls expiring tomorrow
    
    for (const poll of pollsExpiringTomorrow) {
      // Get all voters for this poll
      const votes = await Vote.find({ pollId: poll._id }).distinct('userId');
      
      // Add poll owner if not already included
      const allRecipients = new Set(votes);
      if (poll.createdBy) {
        allRecipients.add(poll.createdBy._id);
      }
      
      if (allRecipients.size > 0) {
        const hoursUntilExpiry = Math.ceil((poll.expiresAt - now) / (1000 * 60 * 60));
        
        // Send notification to all recipients
        const notificationPromises = Array.from(allRecipients).map(async (recipientId) => {
          const isOwner = poll.createdBy && recipientId.toString() === poll.createdBy._id.toString();
          const message = isOwner 
            ? `Your poll "${poll.description.substring(0, 50)}${poll.description.length > 50 ? '...' : ''}" will expire in ${hoursUntilExpiry} hours.`
            : `A poll you voted on will expire in ${hoursUntilExpiry} hours.`;
          
          await createNotification({
            recipient: recipientId,
            sender: recipientId,
            type: 'poll_expiry',
            title: 'Poll Expiry Reminder',
            message: message,
            relatedPoll: poll._id
          });
        });
        
        await Promise.all(notificationPromises);
        
        // Update the last daily notification time
        await Poll.findByIdAndUpdate(poll._id, {
          lastDailyNotification: now
        });
        
        // Sent daily reminder for poll: ${poll._id} to ${allRecipients.size} recipients
      }
    }
    
  } catch (error) {
    console.error('Error checking expiring polls:', error);
  }
};

// Function to run the check every hour
export const startPollExpiryChecker = () => {
  // Starting poll expiry checker...
  
  // Run immediately on start
  checkExpiringPolls();
  
  // Then run every hour
  setInterval(checkExpiringPolls, 60 * 60 * 1000); // 1 hour
};
