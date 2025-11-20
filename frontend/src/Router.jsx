import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import LandingPage from "./pages/landingPage";
import Login from "./pages/login";
import AuthCallback from "./pages/AuthCallback";
import useAppStore from "./store";
import Feed from "./pages/feed";
import MyPollsPage from "./pages/myPolls";
import ProtectedRoute from "./ProtectedRoutes";
import Profile from "./components/Profile";
import JoinPrivatePoll from "./components/JoinPrivatePoll";
import PrivatePollView from "./components/PrivatePollView";
import PublicRoute from "./PublicRoute";
import SettingsPage from "./pages/settings";
const Router = () => {
  useAppStore();
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={
          <PublicRoute>
          <LandingPage />
          </PublicRoute>
          } />
        <Route path="/signup" element={
          <PublicRoute>
          <Signup />
          </PublicRoute>
          } />
        <Route path="/login" element={
          <PublicRoute>
          <Login />
          </PublicRoute>
          } />
        <Route 
          path="/feed" 
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-polls" 
          element={
            <ProtectedRoute>
              <MyPollsPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/profile" element={
          <ProtectedRoute>
          <Profile />
          </ProtectedRoute>
          } />
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
          <Profile />
          </ProtectedRoute>
          } />
        <Route path="/join-private" element={
          <ProtectedRoute>
            <JoinPrivatePoll />
          </ProtectedRoute>
        } />
        <Route path="/poll/:pollId" element={
          <ProtectedRoute>
            <PrivatePollView />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;