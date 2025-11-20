import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Users, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/api";
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { ShareButton } from './sharebutton';

const PrivatePollView = () => {
  const { pollId } = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [user, setUser] = useState(null);
  // Fetch poll data
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await apiRequest("GET", `/polls/${pollId}`);
        if (response.data?.poll) {
          setPoll(response.data.poll);
          
          // Fetch user profile
          try {
            const profileResponse = await apiRequest("GET", "/profile/check");
            setUser(profileResponse.data);
            
            // Fetch votes
            const votesResponse = await apiRequest("GET", `/votes/vote/${pollId}`);
            const votes = votesResponse.data.votes || [];
            
            // Check if user has already voted
            const userVote = votes.find(vote => 
              vote.user === profileResponse.data._id || 
              vote.userId === profileResponse.data._id
            );
            
            if (userVote) {
              setHasVoted(true);
              setSelectedOption(userVote.optionIndex);
            }
            
            // Calculate initial results
            const calculatedResults = response.data.poll.options.map((option, index) => {
              const optionVotes = votes.filter(v => v.optionIndex === index).length;
              const totalVotes = votes.length;
              return {
                option,
                votes: optionVotes,
                percentage: totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
              }
            })
            
            setResults(calculatedResults);
            setTotalVotes(totalVotes);
            
          } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Failed to load user data');
          }
        }
      } catch (error) {
        console.error('Error fetching poll:', error);
        toast.error("Failed to load poll");
        navigate('/feed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [pollId, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profileResponse = await apiRequest("GET", "/profile/check")
        setUser(profileResponse.data)
      } catch (error) {
      toast.error('Failed to fetch user');
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    if (!pollId || !user?._id) return;

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: { 
        pollId, 
        userId: user._id
      }
    });
    
    // Initializing WebSocket connection...

    newSocket.on('connect', () => {
      // Connected to WebSocket server
    });

    newSocket.on('vote', (data) => {
      // Received vote update:
      if (data.pollId === pollId) {
        const updatedResults = data.results.map(result => ({
          ...result,
          percentage: Math.round(result.percentage)
        }));
        
        // Updating results with:
        setResults(updatedResults);
        setTotalVotes(data.totalVotes);
        
        if (data.voterId === user._id) {
          setHasVoted(true);
          setSelectedOption(data.voterOptionIndex);
        }
      }
    });

    newSocket.on('initialResults', (data) => {
      // Received initial results:
      if (data.pollId === pollId) {
        setResults(data.results.map(r => ({
          ...r,
          percentage: Math.round(r.percentage)
        })));
        setTotalVotes(data.totalVotes);
        setHasVoted(!!data.hasVoted);
      }
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error(error.message || 'Connection error');
    });

    newSocket.on('voteError', (error) => {
      console.error('Vote error:', error);
      if (error.message === 'You already voted on this poll') {
        setHasVoted(true);
      }
      toast.error(error.message || 'Failed to submit vote');
    });

    newSocket.on('disconnect', () => {
      // Disconnected from WebSocket server
    });

    setSocket(newSocket);

    return () => {
      // Cleaning up WebSocket connection
      if (newSocket) {
        newSocket.off('vote');
        newSocket.off('initialResults');
        newSocket.off('error');
        newSocket.off('voteError');
        newSocket.off('disconnect');
        newSocket.close();
      }
    };
  }, [pollId, user?._id]);

  const fetchResults = async () => {
    try {
      const votesResponse = await apiRequest("GET", `/votes/vote/${pollId}`)
      const votes = votesResponse.data.votes || []
      const totalVotes = votes.length
      
      const profileResponse = await apiRequest("GET", "/profile/check")
      const currentUserId = profileResponse.data?._id
      const userVote = votes.find(vote => vote.user === currentUserId || vote.userId === currentUserId)
      
      if (userVote) {
        setHasVoted(true)
        setSelectedOption(userVote.optionIndex)
      }
      
      const calculatedResults = poll.options.map((option, index) => {
        const optionVotes = votes.filter(vote => vote.optionIndex === index).length
        return {
          option,
          votes: optionVotes,
          percentage: totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
        }
      })
      
      setResults(calculatedResults)
      setTotalVotes(totalVotes)
    } catch (error) {
      console.error('Error fetching results:', error)
    }
  }

  const handleVote = () => {
  if (selectedOption === null) {
    toast.error("Please select an option to vote");
    return;
  }

  if (hasVoted) {
    toast.error("You have already voted on this poll");
    return;
  }

  // Optimistic UI update (optional, will be confirmed by socket)
  const newTotalVotes = totalVotes + 1;
  const updatedResults = results.map((result, index) => {
    if (index === selectedOption) {
      const newVotes = result.votes + 1;
      return {
        ...result,
        votes: newVotes,
        percentage: (newVotes / newTotalVotes) * 100
      };
    }
    return {
      ...result,
      percentage: (result.votes / newTotalVotes) * 100
    };
  });

  setResults(updatedResults);
  setTotalVotes(newTotalVotes);
  setHasVoted(true);

  // Emit vote to server
  if (socket) {
    socket.emit('vote', { optionIndex: selectedOption });
  } else {
    toast.error("Connection lost. Vote could not be sent.");
    // Optional: reset UI if vote cannot be sent
    setHasVoted(false);
  }

  toast.success("Vote submitted!");
};

  const handleGoBack = () => {
    navigate('/feed')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading private poll...</p>
        </div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Poll Not Found</h3>
            <p className="text-gray-600 mt-2">This private poll may not exist or you may not have access.</p>
            <Button onClick={handleGoBack} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Private Poll</span>
              </div>
              <ShareButton pollId={poll._id} pollDescription={poll.description} />
            </div>
            <CardTitle className="text-xl">{poll.description}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Exclusive access poll
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {!hasVoted ? (
              <div className="space-y-3">
                <h4 className="font-medium">Cast Your Vote:</h4>
                {poll.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedOption === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOption(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedOption === index
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedOption === index && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </div>
                ))}

                <Button 
                  onClick={handleVote}
                  disabled={selectedOption === null}
                  className="w-full mt-4"
                >
                  Submit Vote
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-600">Live Results</h4>
                </div>
                
                {results.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{result.option}</span>
                      <span className="text-gray-600">
                        {result.votes} votes ({result.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 text-center">
                    Thank you for voting in this private WePollin poll!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PrivatePollView
