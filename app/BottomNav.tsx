"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export default function BottomNav() {

  const pathname = usePathname()

  if (pathname === "/widget") return null

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4">

      <div className="w-full md:max-w-lg">

        <div className="relative w-full rounded-full bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.15)] p-1 flex">

          {/* Sliding Active Background */}
          <div
            className={`absolute top-1 bottom-1 rounded-full bg-blue-600 shadow-md transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
              ${
                pathname === "/"
                  ? "left-1 w-[calc(50%-4px)]"
                  : "left-[calc(50%+2px)] w-[calc(50%-4px)]"
              }
            `}
          />

          {/* HOME */}
          <Link
            href="/"
            className={`relative z-10 flex-1 flex flex-col items-center justify-center py-3 transition-all duration-300 ${
              pathname === "/" ? "text-white font-semibold scale-105" : "text-gray-700"
            }`}
          >
            <span className="text-xs mt-1 tracking-wide">HOME</span>
          </Link>

          {/* REPORTS */}
          <Link
            href="/reports"
            className={`relative z-10 flex-1 flex flex-col items-center justify-center py-3 transition-all duration-300 ${
              pathname === "/reports" ? "text-white font-semibold scale-105" : "text-gray-700"
            }`}
          >
            <span className="text-xs mt-1 tracking-wide">REPORTS</span>
          </Link>

        </div>

      </div>
    </nav>
  )

}
