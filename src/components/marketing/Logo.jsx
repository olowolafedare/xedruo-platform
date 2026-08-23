import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="42" height="42" rx="10" fill="#0d1f3c"/>
        <path d="M13 23 C13 15.8 17 9 21 9 C25 9 29 15.8 29 23" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <rect x="10" y="22" width="4.5" height="7" rx="2.2" fill="white"/>
        <rect x="27.5" y="22" width="4.5" height="7" rx="2.2" fill="white"/>
        <rect x="15.5" y="27" width="2" height="3" rx="0.7" fill="#22c55e"/>
        <rect x="18.5" y="24.5" width="2" height="5.5" rx="0.7" fill="#22c55e"/>
        <rect x="21.5" y="22" width="2" height="8" rx="0.7" fill="#22c55e"/>
        <rect x="24.5" y="19.5" width="2" height="10.5" rx="0.7" fill="#22c55e"/>
      </svg>
      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold text-white tracking-wide">Xedruo</span>
        <span className="text-[7px] text-gray-400 font-normal tracking-widest uppercase">Music · Distribution · Financial</span>
      </div>
    </Link>
  );
}