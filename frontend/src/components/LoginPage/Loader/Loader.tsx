import React from "react";
import "./Loader.css";

const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader-wrapper">
        {/* Khối các ô cell nhấp nháy */}
        <div className="loader">
          <div className="cell d-0" />
          <div className="cell d-1" />
          <div className="cell d-2" />
          <div className="cell d-1" />
          <div className="cell d-2" />
          <div className="cell d-2" />
          <div className="cell d-3" />
          <div className="cell d-3" />
          <div className="cell d-4" />
        </div>
        
        {/* 🚀 Chữ neon mới được thêm vào ở đây */}
        <p className="loader-text">Connecting to hub...</p>
      </div>
    </div>
  );
};

export default Loader;