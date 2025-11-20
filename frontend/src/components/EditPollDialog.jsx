import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../api';
import { toast } from 'sonner';

export function EditPollDialog({ poll, open, onOpenChange, onPollUpdated }) {
  const [description, setDescription] = useState(poll?.description || '');
  const [options, setOptions] = useState(poll?.options?.length ? [...poll.options] : [{ text: '' }, { text: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      toast.error('A poll must have at least 2 options');
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast.error('Please enter a poll question');
      return;
    }

    const validOptions = options.filter(option => option.text.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('PUT', `polls/poll/${poll._id}`, {
        description,
        options: validOptions.map(opt => ({ text: opt.text }))
      });
      
      if (response.data) {
        toast.success('Poll updated successfully');
        onPollUpdated(response.data);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating poll:', error);
      toast.error(error.response?.data?.message || 'Failed to update poll');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
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
                setIsLoading(true);
                await apiRequest('DELETE', `polls/poll/${poll._id}`);
                toast.success('Poll deleted successfully');
                onPollUpdated(null);
                onOpenChange(false);
              } catch (error) {
                console.error('Error deleting poll:', error);
                toast.error(error.response?.data?.message || 'Failed to delete poll');
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    ), {
      duration: 10000, // Keep it open longer since user needs to interact
      position: 'top-center',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Poll</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Poll Question</Label>
            <Input
              id="question"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ask a question..."
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Poll
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
