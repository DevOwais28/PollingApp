import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Edit, Save, X, ArrowLeft, Lock, Eye } from "lucide-react";
import { apiRequest } from "@/api";
import { toast } from "sonner";
import useAppStore from "@/store";

const avatarOptions = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=6",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=7",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=8",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=9",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=10",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=11",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=12"
];

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [privatePollsLoading, setPrivatePollsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [profileUser, setProfileUser] = useState(null);
  const [privatePolls, setPrivatePolls] = useState([]);
  
  const currentUser = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Check if viewing own profile or someone else's
  const isOwnProfile = !userId || userId === currentUser?._id;
  const displayUser = isOwnProfile ? currentUser : profileUser;

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setUsername(currentUser.username || '');
      setSelectedAvatar(currentUser.avatar || avatarOptions[0]);
      // Fetch private polls for own profile
      fetchPrivatePolls(currentUser._id);
    } else if (!isOwnProfile && userId) {
      fetchUserProfile(userId);
    }
  }, [isOwnProfile, currentUser, userId]);

  const fetchUserProfile = async (userId) => {
    setProfileLoading(true);
    try {
      const response = await apiRequest('GET', `/profile/${userId}`);
      if (response.data.success) {
        setProfileUser(response.data.user);
      }
    } catch (error) {
      toast.error('Failed to load user profile');
      navigate('/profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchPrivatePolls = async (userId) => {
    setPrivatePollsLoading(true);
    try {
      const response = await apiRequest('GET', `/profile/${userId}/private-polls`);
      if (response.data.success) {
        setPrivatePolls(response.data.polls);
      }
    } catch (error) {
      console.error('Failed to load private polls:', error);
    } finally {
      setPrivatePollsLoading(false);
    }
  };

  const validateUsername = (value) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateUsername(username)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('PUT', 'profile/update', {
        username,
        avatar: selectedAvatar
      });

      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setUser(response.data.user);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response?.data?.message?.includes('taken')) {
        setUsernameError('Username already taken');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername(currentUser.username || '');
    setSelectedAvatar(currentUser.avatar || avatarOptions[0]);
    setUsernameError('');
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please login to view profiles</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {isOwnProfile ? 'Profile Settings' : `${displayUser.name || displayUser.username}'s Profile`}
                </CardTitle>
                <CardDescription>
                  {isOwnProfile ? 'Manage your username and avatar' : 'View user information'}
                </CardDescription>
              </div>
              {!isOwnProfile && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to My Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Display */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={displayUser.avatar} alt={displayUser.username || displayUser.name} />
                <AvatarFallback>{displayUser.username?.charAt(0) || displayUser.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{displayUser.name || displayUser.username}</h3>
                <p className="text-sm text-gray-500">@{displayUser.username}</p>
                <p className="text-sm text-gray-500">{displayUser.email}</p>
              </div>
            </div>

            {/* Private Polls Section - Only for own profile */}
            {isOwnProfile && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-t pt-6">
                  <Lock className="w-4 h-4 text-gray-600" />
                  <h4 className="text-lg font-semibold">My Private Polls</h4>
                </div>
                
                {privatePollsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : privatePolls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">You haven't created any private polls yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {privatePolls.map((poll) => (
                      <Card key={poll._id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 mb-2">{poll.description}</h5>
                              <div className="space-y-1">
                                {poll.options?.slice(0, 3).map((option, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    <span>{option.text}</span>
                                  </div>
                                ))}
                                {poll.options?.length > 3 && (
                                  <p className="text-xs text-gray-500">+{poll.options.length - 3} more options</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              <span>Private</span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              Created {new Date(poll.createdAt).toLocaleDateString()}
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/poll/${poll._id}`)}
                            >
                              View Poll
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit Section - Only for own profile */}
            {isOwnProfile && (
              <>
                {!isEditing ? (
                  <div className="flex justify-end">
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Username Edit */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          validateUsername(e.target.value);
                        }}
                        placeholder="Enter username"
                        maxLength={20}
                        className={usernameError ? "border-red-500" : ""}
                      />
                      {usernameError && (
                        <p className="text-sm text-red-500">{usernameError}</p>
                      )}
                    </div>

                    {/* Avatar Selection */}
                    <div className="space-y-2">
                      <Label>Choose Avatar</Label>
                      <div className="grid grid-cols-6 gap-3">
                        {avatarOptions.map((avatar, index) => (
                          <div
                            key={index}
                            className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                              selectedAvatar === avatar
                                ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedAvatar(avatar)}
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} />
                              <AvatarFallback>{index + 1}</AvatarFallback>
                            </Avatar>
                            {selectedAvatar === avatar && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={loading || usernameError}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
