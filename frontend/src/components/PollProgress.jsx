"use client"
import { apiRequest } from "@/api";
import React, { useEffect, useState } from "react";
import useAppStore from "@/store";
import { toast } from "sonner";

const PollProgress = ({ options, pollId, onVoteComplete }) => {
  const [selected, setSelected] = useState(null);
  const [pollVotes, setPollVotes] = useState(Array(options.length).fill(0));
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState(null);
  const user = useAppStore((state) => state.user);

  

  const fetchVotes = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await apiRequest("GET", `votes/vote/${pollId}`);

      const votes = response.data.votes || [];
      const voteCounts = Array(options.length).fill(0);

      // Check if current user has already voted
      let currentUserVote = null;
      if (user && user.id) {
        currentUserVote = votes.find(vote => 
          vote.userId === user.id || vote.user === user.id
        );
      }

      votes.forEach(vote => {
        if (vote.optionIndex >= 0 && vote.optionIndex < options.length) {
          voteCounts[vote.optionIndex]++;
        }
      });

      setPollVotes(voteCounts);
      setUserVote(currentUserVote ? currentUserVote.optionIndex : null);
    } catch (error) {
      console.error("Error fetching votes:", error);
      setPollVotes(Array(options.length).fill(0));
      setUserVote(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
  // Poll ID changed:
  fetchVotes();
}, [pollId, user?._id]); // Only depend on user ID, not the entire user object

const handleVote = async (optionIndex) => {
  if (!user) return toast.error("Please login to vote");
  if (userVote !== null) {
    return toast.error("You have already voted on this poll");
  }

  // Frontend voting attempt
  const optimisticData = {
    pollId,
    optionIndex,
    userId: user.id,
    userObject: user
  };

  // Optimistic update
  const updatedVotes = [...pollVotes];
  updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;
  setPollVotes(updatedVotes);
  setUserVote(optionIndex);

  try {
    const response = await apiRequest("POST", `votes/vote/${pollId}`, { optionIndex });
    // Vote response:
    
    if (!response.data.success) {
      // rollback if failed
      updatedVotes[optionIndex]--;
      setPollVotes(updatedVotes);
      setUserVote(null);
      
      // Handle specific "already voted" error
      if (response.data.message && response.data.message.includes("already voted")) {
        toast.error("You have already voted on this poll");
        // Refresh votes to get correct state
        fetchVotes(false);
      } else {
        toast.error(response.data.message || "Failed to submit vote");
      }
    } else {
      toast.success("Vote submitted successfully!");
    }
  } catch (error) {
    console.error("Error voting:", error);
    
    // rollback optimistic update
    updatedVotes[optionIndex]--;
    setPollVotes(updatedVotes);
    setUserVote(null);
    
    // Handle specific error messages
    const errorMessage = error.response?.data?.message;
    // Error response:
    
    if (errorMessage && errorMessage.includes("already voted")) {
      toast.error("You have already voted on this poll");
      // Refresh votes to get correct state
      fetchVotes(false);
    } else {
      toast.error(errorMessage || "Failed to submit vote. Please try again.");
    }
  }
};


  const totalVotes = pollVotes.reduce((sum, v) => sum + v, 0);

  if (loading) {
    return (
      <div className="w-full p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(options.length)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {options.map((option, index) => {
        const votesForOption = pollVotes[index] || 0;
        const percentage = totalVotes > 0 ? Math.round((votesForOption / totalVotes) * 100) : 0;

        return (
          <button
            key={index}
            onClick={() => handleVote(index)}
            disabled={userVote !== null}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200
              ${userVote !== null
                ? userVote === index
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              } ${userVote !== null ? "cursor-default" : "cursor-pointer"}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">{option}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{votesForOption} votes</span>
                {totalVotes > 0 && (
                  <span className="text-sm font-medium text-gray-900">{percentage}%</span>
                )}
              </div>
            </div>

            {totalVotes > 0 && (
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    userVote === index ? "bg-blue-500" : "bg-gray-400"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </button>
        );
      })}

      <p className="text-sm text-gray-600 text-center">
        {totalVotes} {totalVotes === 1 ? "vote" : "votes"} total
      </p>
    </div>
  );
};

export { PollProgress };
