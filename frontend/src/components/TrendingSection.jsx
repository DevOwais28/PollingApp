import React, { useState, useEffect } from 'react'
import { TrendingUp, Hash, Users, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiRequest } from "@/api"
import { useNavigate } from "react-router-dom"

const TrendingSection = () => {
  const [trendingPolls, setTrendingPolls] = useState([])
  const [activePolls, setActivePolls] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrendingData()
  }, [])

  const fetchTrendingData = async () => {
    try {
      setLoading(true)
      const [trendingResponse, activeResponse] = await Promise.all([
        apiRequest("GET", "/polls/trending"),
        apiRequest("GET", "/polls/active")
      ])
      
      setTrendingPolls(trendingResponse.data.trendingPolls || [])
      setActivePolls(activeResponse.data.activePolls || [])
    } catch (error) {
      console.error('Error fetching trending data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePollClick = (pollId) => {
    navigate(`/poll/${pollId}`)
  }

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  // Generate trending topics from poll descriptions
  const generateTrendingTopics = () => {
    const topics = {}
    trendingPolls.forEach(poll => {
      const words = poll.description.toLowerCase().split(' ')
      words.forEach(word => {
        if (word.length > 4) { // Only consider words longer than 4 characters
          topics[word] = (topics[word] || 0) + poll.voteCount
        }
      })
    })
    
    return Object.entries(topics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({
        hashtag: `#${topic}`,
        posts: count
      }))
  }

  const trendingTopics = generateTrendingTopics()

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-3 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-3 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Trending Topics
        </h3>
        <div className="space-y-2">
          {trendingTopics.length > 0 ? (
            trendingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-700 hover:text-blue-600 transition-colors">
                    {topic.hashtag}
                  </span>
                </div>
                <span className="text-gray-500 text-xs font-medium">
                  {topic.posts} votes
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 p-2">No trending topics yet</p>
          )}
        </div>
      </div>

      {/* Active Polls */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-green-600" />
          Active Polls
        </h3>
        <div className="space-y-2">
          {activePolls.length > 0 ? (
            activePolls.map((poll, index) => (
              <div 
                key={poll._id} 
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => handlePollClick(poll._id)}
              >
                <p className="text-sm text-gray-700 hover:text-blue-600 transition-colors mb-1 font-medium">
                  {truncateText(poll.description, 45)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    {poll.recentVoteCount} votes
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(poll.lastActivity)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 p-2">No active polls recently</p>
          )}
        </div>
      </div>

      {/* Most Voted */}
      {trendingPolls.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Most Voted
          </h3>
          <div className="space-y-2">
            {trendingPolls.slice(0, 5).map((poll, index) => (
              <div 
                key={poll._id} 
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => handlePollClick(poll._id)}
              >
                <p className="text-sm text-gray-700 hover:text-blue-600 transition-colors mb-1 font-medium">
                  {truncateText(poll.description, 45)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    {poll.voteCount} votes
                  </span>
                  <span className="text-xs text-gray-400">
                    @{poll.createdBy?.username || 'anonymous'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TrendingSection
