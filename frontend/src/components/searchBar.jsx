import React, { useState, useEffect } from 'react'
import { SearchIcon, X, User } from "lucide-react"
import { apiRequest } from '@/api'
import { Link } from 'react-router-dom'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // debounced value
  const debouncedSearch = useDebounce(searchTerm, 500);

  // effect triggers only after user stops typing for 500ms
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest(
          "GET",
          `/profile/search/${debouncedSearch}`
        );
        
        if (response.data.success) {
          setSearchResults(response.data.users || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setIsFocused(false);
  };

  const handleResultClick = () => {
    clearSearch();
  };

  return (
    <div className="relative">
      <form onSubmit={(e) => e.preventDefault()} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search users..."
            className={`block w-full max-w-md pl-10 pr-10 py-2 border rounded-lg text-sm 
              ${isFocused ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'} 
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
              transition-colors duration-200 bg-white text-gray-900 placeholder-gray-500`}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isFocused && (searchTerm || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name || user.username} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center">
              <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No users found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
