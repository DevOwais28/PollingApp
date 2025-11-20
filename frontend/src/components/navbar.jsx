import React from 'react';
import { Link, useLocation } from "react-router-dom";
import SearchBar from "./searchBar";
import NotificationsBell from "./NotificationsBell";
import { Menu, User, Settings, BarChart3, Vote, Home, Lock, Archive } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useAppStore from "@/store";

const Navbar = () => {
  const location = useLocation();
  const user = useAppStore((state) => state.user);
  
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage;
  const isFeed = location.pathname === '/feed' || location.pathname.startsWith('/my-polls') || location.pathname.startsWith('/voted-polls');

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WePollin
              </span>
            </Link>
            {isFeed && (
              <div className="hidden md:block ml-8">
                <SearchBar />
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {!isAuthPage && (
              <>
                {user ? (
                  <>
                    <Link to="/join-private" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Join Private
                    </Link>
                    <NotificationsBell />
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        useAppStore.getState().clearUser();
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                      Sign In
                    </Link>
                    <Link to="/signup">
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Mobile Notifications + Menu */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationsBell />
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Menu className="h-5 w-5 text-gray-700" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
              <SheetHeader className="border-b pb-2 mb-3">
                <div className="flex items-center justify-between">
                  <SheetTitle>Menu</SheetTitle>
                </div>
              </SheetHeader>
              <div className="py-4 space-y-3">
                {isFeed && (
                  <div className="mb-4 px-1">
                    <SearchBar />
                  </div>
                )}
                {user ? (
                  <>
                    <Link to="/feed" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <Home className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Feed</span>
                    </Link>
                    <Link to="/my-polls" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <Vote className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">My Polls</span>
                    </Link>
                    <Link to="/join-private" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <Lock className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Join Private Poll</span>
                    </Link>
                    <Link to="/voted-polls" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Voted Polls</span>
                    </Link>
                    <Separator />
                    <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Profile</span>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left p-3 hover:bg-gray-100"
                      onClick={() => {
                        useAppStore.getState().clearUser();
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/';
                      }}
                    >
                      <User className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-gray-700">Logout</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Sign In</span>
                    </Link>
                    <Link to="/signup" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
