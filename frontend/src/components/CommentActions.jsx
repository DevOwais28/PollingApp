import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { apiRequest } from '../api';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from 'date-fns';
import useAppStore from '../store';

export function CommentActions({ comment, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const currentUser = useAppStore(state => state.user);

  const isCurrentUserComment = currentUser?._id === comment.user?._id;
  
  if (!isCurrentUserComment) {
    return (
      <div className="text-xs text-gray-500">
        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editedContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('PUT', `comment/${comment._id}`, {
        content: editedContent
      });
      
      if (response.data) {
        toast.success('Comment updated');
        onUpdate(response.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error(error.response?.data?.message || 'Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest('DELETE', `comment/${comment._id}`);
      toast.success('Comment deleted');
      onDelete(comment._id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 w-full">
        <form onSubmit={handleUpdate} className="space-y-2">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            disabled={isLoading}
            className="min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
      <span>•</span>
      <button
        onClick={() => setIsEditing(true)}
        className="text-blue-600 hover:text-blue-800 hover:underline"
        disabled={isLoading}
      >
        Edit
      </button>
      <span>•</span>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-800 hover:underline"
        disabled={isLoading}
      >
        Delete
      </button>
    </div>
  );
}
