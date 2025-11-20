import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiRequest } from "@/api"
import { toast } from 'sonner'

const JoinPrivatePoll = () => {
  const [privateKey, setPrivateKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoinPoll = async (e) => {
    e.preventDefault()
    
    if (!privateKey.trim()) {
      toast("Please enter a private access key")
      return
    }

    setIsLoading(true)

    try {
      const response = await apiRequest("POST", "/polls/join-private", { privateKey })
      
      if (response.data?.poll) {
        toast("Successfully joined private poll!")
        navigate(`/poll/${response.data.poll._id}`)
      } else {
        toast("Invalid or expired access key")
      }
    } catch (error) {
      console.error('Error joining private poll:', error)
      toast(error.response?.data?.message || "Failed to join private poll")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Join Private Poll</CardTitle>
          <CardDescription>
            Enter the private access key to join an exclusive WePollin poll
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleJoinPoll} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privateKey" className="text-sm font-medium">
                Private Access Key
              </Label>
              <Input
                id="privateKey"
                type="text"
                placeholder="Enter the access key..."
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                className="font-mono"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                The access key should be a 16-character alphanumeric code
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !privateKey.trim()}
            >
              {isLoading ? (
                "Joining..."
              ) : (
                <>
                  Join Private Poll
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an access key?
            </p>
            <Button 
              variant="link" 
              onClick={() => navigate('/feed')}
              className="text-sm text-blue-600 hover:text-blue-700 p-0 h-auto"
            >
              Browse public polls
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default JoinPrivatePoll
