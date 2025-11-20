import React, { useState } from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { PollProgress } from "./PollProgress";
import CommentSection from "./CommentSection";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditPollDialog } from './EditPollDialog';
import { apiRequest } from '@/api';
import { toast } from 'sonner';
import useAppStore from '@/store';
import { ShareButton } from './sharebutton';

const PollCard = ({ poll, onVote, onPollUpdated }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Calculate expiration status
  const isExpired = poll.expiresAt && new Date() > new Date(poll.expiresAt);
  const timeRemaining = poll.expiresAt 
    ? Math.ceil((new Date(poll.expiresAt) - new Date()) / (1000 * 60 * 60))
    : null;
  const currentUser = useAppStore(state => state.user);
  const isPollOwner = currentUser?._id === poll.createdBy?._id;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!poll || !poll._id) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="text-gray-500 text-center py-2">Loading poll...</div>
      </div>
    );
  }

  
  const handleDeletePoll = async () => {
    toast.custom((t) => (
      <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-2">Delete Poll</h3>
        <p className="text-gray-700 mb-4">Are you sure you want to delete this poll? This action cannot be undone.</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                setIsDeleting(true);
                await apiRequest('DELETE', `polls/poll/${poll._id}`);
                toast.success('Poll deleted successfully');
                if (onPollUpdated) {
                  onPollUpdated(null);
                }
              } catch (error) {
                console.error('Error deleting poll:', error);
                toast.error(error.response?.data?.message || 'Failed to delete poll');
              } finally {
                setIsDeleting(false);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    ), {
      duration: 10000, // Keep it open longer since user needs to interact
      position: 'top-center',
    });
  };

  const handlePollUpdated = (updatedPoll) => {
    if (onPollUpdated) {
      onPollUpdated(updatedPoll);
    }
  };

  return (
    <div className="p-4 sm:p-6 relative">
      {/* Poll Actions Dropdown */}
      {isPollOwner && (
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Poll actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Poll</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={handleDeletePoll}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Poll'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Creator Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage 
              src={poll.createdBy?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous'} 
              alt={poll.createdBy?.username || 'Anonymous'} 
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 font-medium text-xs sm:text-sm">
              {(poll.createdBy?.username || 'Anonymous').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
              {poll.createdBy?.name || poll.createdBy?.username || 'Anonymous User'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              @{poll.createdBy?.username || 'anonymous'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <span className="hidden sm:inline">{formatDate(poll.createdAt || new Date())}</span>
          <span className="sm:hidden">{formatDateShort(poll.createdAt || new Date())}</span>
          <span>•</span>
          <span className="text-green-600 font-medium">
            {poll.isPrivate ? 'Private' : 'Public'}
          </span>
        </div>
      </div>
      
      {/* Poll Question */}
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 leading-tight">
        {poll.description || 'Untitled Poll'}
      </h3>

      {/* Poll Options */}
      <div className="mb-4 sm:mb-6">
        <PollProgress
          key={poll._id}
          options={poll.options || []}
          pollId={poll._id}
          onVoteComplete={onVote}
        />
      </div>

      {/* Poll Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
          <span>{poll.options?.length || 0} options</span>
          <span>•</span>
          <span className="hidden sm:inline">{formatDate(poll.createdAt || new Date())}</span>
          <span className="sm:hidden">{formatDateShort(poll.createdAt || new Date())}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isExpired && timeRemaining > 0 ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-gray-600">{timeRemaining} hours remaining</span>
            </>
          ) : (
            <span className="text-xs sm:text-sm text-red-500">Poll Ended</span>
          )}
        </div>
      </div>

      {/* Comment Section */}
      <div className="mt-4">
        <CommentSection pollId={poll._id} />
        <ShareButton pollId={poll._id} pollDescription={poll.description} />
      </div>

      {/* Edit Poll Dialog */}
      {isEditDialogOpen && (
        <EditPollDialog 
          poll={poll} 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          onPollUpdated={handlePollUpdated}
        />
      )}
    </div>
  );
};

export default PollCard
