import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, User, MessageSquare, Vote, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const NotificationsBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      const response = await apiRequest('GET', '/notifications?limit=10');
      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await apiRequest('GET', '/notifications/unread-count');
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (notificationId) => {
    try {
      await apiRequest('PUT', `/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('PUT', '/notifications/read-all');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await apiRequest('DELETE', `/notifications/${notificationId}`);
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (!deletedNotif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'profile_visit') {
      navigate(`/profile/${notification.sender._id}`);
    } else if (notification.relatedPoll) {
      navigate(`/poll/${notification.relatedPoll._id}`);
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'poll_vote':
        return <Vote className="w-4 h-4 text-blue-600" />;
      case 'poll_comment':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'profile_visit':
        return <Eye className="w-4 h-4 text-purple-600" />;
      case 'mention':
        return <User className="w-4 h-4 text-orange-600" />;
      case 'poll_expiry':
        return <Clock className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`${unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}`}
      >
        <Bell className="w-5 h-5 text-gray-700 md:w-6 md:h-6" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 min-w-5 h-5 p-0 flex items-center justify-center text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <Card className="fixed inset-0 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-h-[calc(100vh-4rem)] sm:rounded-lg overflow-hidden shadow-xl z-50 sm:max-w-none w-full h-full sm:h-auto bg-white flex flex-col">
          {/* Mobile header */}
          <div className="sm:hidden flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 -mr-2"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CardContent className="p-0">
            {/* Desktop Header */}
            <div className="hidden sm:flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs h-8 px-2"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${
                                !notification.isRead ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => deleteNotification(notification._id, e)}
                              className="ml-2 h-8 w-8 p-0 flex items-center justify-center rounded-full"
                              aria-label="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-10"
                  onClick={() => {
                    // Navigate to full notifications page
                    navigate('/notifications');
                    setIsOpen(false);
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default NotificationsBell;
