import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Header = () => {
  return (
    <header className="bg-black bg-opacity-50 text-white ">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link to="/">
          <Logo />
        </Link>
        <h1 className="text-lg font-bold">VR Environment Project</h1>
        <div>
          <Link
            to="/explore"
            className="text-white hover:text-gray-200 px-4 py-2 rounded transition"
          >
            Explore
          </Link>
          <Link
            to="/history"
            className="text-white hover:text-gray-200 px-4 py-2 rounded transition"
          >
            History
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
