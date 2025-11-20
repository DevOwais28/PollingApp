import { Navigate } from "react-router-dom";
import useAppStore from "./store";

const ProtectedRoute = ({ children }) => {
  const user = useAppStore((state) => state.user);
  if (!user) { 
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;