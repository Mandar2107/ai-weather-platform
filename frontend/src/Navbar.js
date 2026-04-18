import React, { useEffect, useState } from "react";
import { FaRegCircleUser } from "react-icons/fa6";

const titles = {
  dashboard: "Realtime field intelligence",
  farmers: "Farmer enrollment and language targeting",
  weather: "City-wise weather monitoring",
  broadcast: "Bulk alert campaign control",
  alerts: "Alert delivery and live monitoring",
  logs: "Farmer schemes and delivery registry"
};

const getProfileKey = (username) => `ai-weather-profile-${username || "guest"}`;

const Navbar = ({ session, onLogout, activePage }) => {
  const username = session ? session.user.username : "Guest mode";
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const storedImage = localStorage.getItem(getProfileKey(username));
    setProfileImage(storedImage || "");
  }, [username]);

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      localStorage.setItem(getProfileKey(username), result);
      setProfileImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    onLogout();
  };

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">AI WEATHER OPERATIONS</p>
          <h1>{titles[activePage] || titles.dashboard}</h1>
          <p className="topbar-credit">Made by Mandar Developer</p>
        </div>

        <div className="topbar-user">
          <button className="user-pill user-pill-button" type="button" onClick={() => setIsProfileOpen(true)}>
            {profileImage ? (
              <img src={profileImage} alt={`${username} profile`} className="user-avatar" />
            ) : (
              <FaRegCircleUser />
            )}
            <span>{username}</span>
          </button>

          {session ? (
            <button className="ghost-button" onClick={handleLogoutClick}>
              Log out
            </button>
          ) : null}
        </div>
      </header>

      {isProfileOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsProfileOpen(false)}>
          <div className="modal-panel profile-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Admin Profile</p>
                <h2>{username}</h2>
              </div>
              <button className="ghost-button" type="button" onClick={() => setIsProfileOpen(false)}>
                Close
              </button>
            </div>

            <div className="profile-modal-body">
              <div className="profile-avatar-card">
                {profileImage ? (
                  <img src={profileImage} alt={`${username} profile`} className="profile-avatar-large" />
                ) : (
                  <div className="profile-avatar-placeholder">
                    <FaRegCircleUser />
                  </div>
                )}
              </div>

              <div className="profile-upload-column">
                <p className="muted">Click below to upload your photo for the admin profile.</p>
                <label className="primary-button profile-upload-button">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Navbar;
