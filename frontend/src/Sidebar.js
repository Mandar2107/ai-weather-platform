import React from "react";
import { FaBell, FaBullhorn, FaChartLine, FaCloudSunRain, FaUsers } from "react-icons/fa6";
import brandMark from "./assets/brand-mark.svg";

const navItems = [
  { id: "dashboard", label: "Overview", icon: <FaChartLine /> },
  { id: "farmers", label: "Farmer Registry", icon: <FaUsers /> },
  { id: "weather", label: "Weather Monitor", icon: <FaCloudSunRain /> },
  { id: "broadcast", label: "Broadcast Center", icon: <FaBullhorn /> },
  { id: "alerts", label: "Live Alerts", icon: <FaBell /> },
  { id: "logs", label: "Farmer Schemes", icon: <FaBell /> }
];

const Sidebar = ({ activePage, onNavigate }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={brandMark} alt="AgroAI Weather logo" className="brand-logo" />
        <div>
          <strong>AgroAI Weather</strong>
          <span>Farmer alert operating system</span>
        </div>
      </div>

      <p className="brand-credit">Made by Mandar Developer</p>

      <nav className="nav-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
