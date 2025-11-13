"use client";
import { AlignLeft } from "lucide-react";
import React, { useState } from "react";
import SideMenu from "./SideMenu";

const MobileMenu = () => {
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);

  return (
    <>
      {/* Hamburger icon always visible */}
      <button onClick={() => setIsSideBarOpen(!isSideBarOpen)}>
        <AlignLeft className="hover:text-black dark:hover:text-white cursor-pointer transition-colors duration-300" />
      </button>

      {/* SideMenu controlled by icon */}
      <SideMenu
        isOpen={isSideBarOpen}
        onClose={() => setIsSideBarOpen(false)}
      />
    </>
  );
};

export default MobileMenu;
