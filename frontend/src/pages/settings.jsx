import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/navbar'
import {AppSidebar} from '../components/app-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  User, 
  Lock, 
  Mail, 
  Shield, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { apiRequest } from '@/api'
import useAppStore from '@/store'

const SettingsPage = () => {
  const navigate = useNavigate()
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)

  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(false)

  // Account settings state
  const [accountData, setAccountData] = useState({
    name: '',
    username: '',
    email: ''
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (user) {
      setAccountData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || ''
      })
    }
  }, [user])

  const handleAccountUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await apiRequest('PUT', '/profile/account-settings', accountData)
      
      if (response.data.success) {
        setUser(response.data.user)
        toast.success('Account settings updated successfully!')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update account settings')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    
    try {
      const response = await apiRequest('POST', '/profile/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (response.data.success) {
        toast.success('Password changed successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    // Skip password check for Google-authenticated users
    if (!user?.googleId && !deletePassword) {
      toast.error('Please enter your password to confirm account deletion')
      return
    }

    setLoading(true)
    
    try {
      // Only include password for non-Google users
      const requestData = user?.googleId ? {} : { password: deletePassword }
      const response = await apiRequest('DELETE', '/profile/delete-account', requestData)
      
      if (response.data.success) {
        toast.success('Account deleted successfully')
        // Clear local storage and redirect
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        useAppStore.getState().clearUser()
        navigate('/')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="hidden md:block md:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <AppSidebar />
              </div>
            </div>
          </div>

          {/* Main Settings Content */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Settings Header */}
              <div className="border-b border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600 mt-1">Manage your account settings and preferences</p>
              </div>

              {/* Settings Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Settings navigation">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Settings Content */}
              <div className="p-6">
                {/* Account Settings Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
                      <form onSubmit={handleAccountUpdate} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Display Name</Label>
                          <Input
                            id="name"
                            type="text"
                            value={accountData.name}
                            onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                            className="mt-1"
                            placeholder="Enter your display name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            type="text"
                            value={accountData.username}
                            onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                            className="mt-1"
                            placeholder="Enter your username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={accountData.email}
                            onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                            className="mt-1"
                            placeholder="Enter your email address"
                          />
                        </div>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="currentPassword"
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.current ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.new ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative mt-1">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.confirm ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                          {loading ? 'Changing Password...' : 'Change Password'}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h2>
                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Profile Visibility</CardTitle>
                            <CardDescription>
                              Control how your profile appears to other users
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600">
                              Your profile is currently public. Other users can find you through search and see your public polls.
                            </p>
                          </CardContent>
                        </Card>

                        <Separator />

                        <Card className="border-red-200">
                          <CardHeader>
                            <CardTitle className="text-base text-red-600 flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Delete Account
                            </CardTitle>
                            <CardDescription>
                              Permanently delete your account and all associated data
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {!showDeleteConfirm ? (
                              <div>
                              <p className="text-sm text-gray-600 mb-4">
                                Once you delete your account, there is no going back. Please be certain.
                              </p>
                              <Button 
                                variant="destructive" 
                                onClick={() => setShowDeleteConfirm(true)}
                              >
                                Delete Account
                              </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-red-800">
                                        This action cannot be undone
                                      </p>
                                      <p className="text-sm text-red-700 mt-1">
                                        This will permanently delete your account and remove all your polls, votes, and comments.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {!user?.googleId && (
                                  <div>
                                    <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                                    <Input
                                      id="deletePassword"
                                      type="password"
                                      value={deletePassword}
                                      onChange={(e) => setDeletePassword(e.target.value)}
                                      className="mt-1"
                                      placeholder="Enter password"
                                    />
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button 
                                    variant="destructive" 
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                  >
                                    {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setShowDeleteConfirm(false)
                                      setDeletePassword('')
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
