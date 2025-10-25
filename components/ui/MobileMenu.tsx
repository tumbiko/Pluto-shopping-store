"use client"
import { AlignLeft } from 'lucide-react'
import React from 'react'
import SideMenu from './SideMenu'
import { useState } from 'react'


const MobileMenu = () => {
    const[isSideBarOpen, setIsSideBarOpen] = useState(false)
  return (
    <>
      <button onClick={() => setIsSideBarOpen(!isSideBarOpen)}>
        <AlignLeft className='md:hidden 
         hover:text-black hover:cursor-pointer hoverEffect'/>
      </button>
      <div className='md:hidden'>
        <SideMenu
        isOpen={isSideBarOpen}  
        onClose={() => setIsSideBarOpen(false)}
        />
      </div>
    </>
  )
}

export default MobileMenu
