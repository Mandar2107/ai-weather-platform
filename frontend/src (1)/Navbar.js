import React from "react";
import { FaRegCircleUser } from "react-icons/fa6";

const titles = {
  dashboard: "Realtime field intelligence",
  farmers: "Farmer enrollment and language targeting",
  weather: "City-wise weather monitoring",
  broadcast: "Bulk alert campaign control",
  alerts: "Alert delivery and live monitoring",
  logs: "Delivery logs and audit visibility"
};

const Navbar = ({ session, onLogout, activePage }) => {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">AI WEATHER OPERATIONS</p>
        <h1>{titles[activePage] || titles.dashboard}</h1>
        <p className="topbar-credit">Made by Mandar Developer</p>
      </div>

      <div className="topbar-user">
        <div className="user-pill">
          <FaRegCircleUser />
          <span>{session ? session.user.username : "Guest mode"}</span>
        </div>

        {session ? (
          <button className="ghost-button" onClick={onLogout}>
            Log out
          </button>
        ) : null}
      </div>
    </header>
  );
};

export default Navbar;
