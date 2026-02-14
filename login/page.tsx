"use client"

import { supabase } from "../../lib/supabase"

export default function Login() {

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <button
        onClick={login}
        className="px-8 py-4 bg-blue-600 text-white rounded-xl text-lg"
      >
        Sign in with Google
      </button>
    </div>
  )
}