'use client';

import React from "react";

export function Footer() {
  return (
    <footer
      id="dashboard-footer"
      className="w-full mt-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-[#282a32] light:border-[#e5e8eb] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#717888] light:text-[#64748b] bg-[#18191d] light:bg-[#f2f4f7] transition-colors shrink-0"
    >
      {/* Left side: Copyright */}
      <div className="flex items-center gap-2.5">
        <span className="font-medium text-[#e2e8f0] light:text-[#0f172a]">© 2026 Sacco</span>
        <span className="text-[#4b5262] light:text-[#cbd5e1]">•</span>
        <span>All Rights Reserved</span>
      </div>

      {/* Right side: Navigation Links */}
      <div className="flex items-center gap-5 text-xs text-[#8e95a5] light:text-[#64748b]">
        <a
          href="#about"
          className="hover:text-white light:hover:text-black transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          About
        </a>
        <a
          href="#support"
          className="hover:text-white light:hover:text-black transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          Support
        </a>
        <a
          href="#contact"
          className="hover:text-white light:hover:text-black transition-colors"
          onClick={(e) => e.preventDefault()}
        >
          Contact Us
        </a>
      </div>
    </footer>
  );
}

export default Footer;
