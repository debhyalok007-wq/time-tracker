"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "../lib/supabase"

export default function Header() {

  const [user, setUser] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const getInitials = (email: string) => {
    return email.split("@")[0].substring(0, 2).toUpperCase()
  }

  return (
    <header className="px-6 pt-6 pb-4">

      <div className="max-w-6xl mx-auto flex justify-between items-center">

        {/* LOGO */}
        <svg width="131" height="32" viewBox="0 0 131 32">
          <rect width="32" height="32" rx="8" fill="#155DFC"/>
          <path d="M17.6913 6.3457H6.7998V12.2865H11.9155V25.6533L17.6913 19.8775V6.3457Z" fill="white"/>
          <path d="M19.259 12.2865V6.3457H25.1998L19.259 12.2865Z" fill="white"/>
        </svg>

        {/* PROFILE */}
        {user && (
          <div className="relative" ref={profileRef}>

            <div
              onClick={() => setShowProfile(!showProfile)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer overflow-hidden"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              ) : (
                getInitials(user.email)
              )}
            </div>

            {showProfile && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                <p className="text-sm mb-3 break-all">
                  {user.email}
                </p>
                <button
                  onClick={logout}
                  className="w-full py-2 bg-red-500 text-white rounded-lg text-sm"
                >
                  Logout
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Light separator */}
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-70"></div>

    </header>
  )
}