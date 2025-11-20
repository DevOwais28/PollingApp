import { Home, User, Settings, BarChart3, Vote } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { title: "Home", url: "/feed", icon: Home },
  { title: "My Polls", url: "/my-polls", icon: BarChart3 },
  // { title: "Voted Polls", url: "/voted-polls", icon: Vote },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <div className="w-full h-full">
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-6">WePollin</h3>
        <nav className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
                ${location.pathname === item.url
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}