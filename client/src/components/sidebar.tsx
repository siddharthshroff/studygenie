import { Link, useLocation } from "wouter";

import Screenshot_2025_05_31_at_7_55_45_PM from "@assets/Screenshot 2025-05-31 at 7.55.45 PM.png";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-chart-line" },
    { href: "/materials", label: "Study Materials", icon: "fas fa-upload" },
    { href: "/flashcards", label: "All Flashcards", icon: "fas fa-layer-group" },
    { href: "/quiz", label: "Take Quiz", icon: "fas fa-question-circle" },
  ];

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-80 bg-white border-r border-gray-200">
        {/* Logo & Brand */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img 
              src={Screenshot_2025_05_31_at_7_55_45_PM} 
              alt="StudySpark AI Logo" 
              className="w-10 h-10"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">StudySpark AI</h1>
              <p className="text-sm text-gray-500">AI Study Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center px-4 py-3 rounded-lg transition-colors font-medium cursor-pointer ${
                  isActive
                    ? "text-primary-700 bg-primary-50 border-l-4 border-primary-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}>
                  <i className={`${item.icon} w-5 mr-3 ${isActive ? "text-primary-600" : "text-gray-500"}`}></i>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <i className="fas fa-user text-gray-600"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Student User</p>
              <p className="text-xs text-gray-500">Free Plan</p>
            </div>
          </div>
          <button 
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => window.location.href = '/api/logout'}
          >
            <i className="fas fa-sign-out-alt w-5 mr-3 text-gray-500"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
