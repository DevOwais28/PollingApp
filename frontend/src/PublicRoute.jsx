import { Navigate } from "react-router-dom";
import useAppStore from "./store";

const PublicRoute = ({children}) =>{
    const user = useAppStore((state)=>state.user)
    if (user) return <Navigate to="/feed" />
    return children
}

export default PublicRoute