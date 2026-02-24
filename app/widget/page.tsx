"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Widget() {

  const [user, setUser] = useState<any>(null)
  const [activeLog, setActiveLog] = useState<any>(null)
  const [elapsed, setElapsed] = useState(0)
  const [todayTotal, setTodayTotal] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = "/login"
        return
      }

      setUser(data.user)
      checkActive(data.user.id)
      calculateToday(data.user.id)
    }

    init()
  }, [])

  useEffect(() => {
    let interval: any
    if (activeLog) {
      interval = setInterval(() => {
        const start = new Date(activeLog.start_time).getTime()
        const now = new Date().getTime()
        setElapsed(Math.floor((now - start) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeLog])

  const checkActive = async (userId: string) => {
    const { data } = await supabase
      .from("time_logs")
      .select("*")
      .eq("user_id", userId)
      .is("end_time", null)
      .maybeSingle()

    setActiveLog(data)
  }

  const calculateToday = async (userId: string) => {
    const today = new Date().toISOString().split("T")[0]

    const { data } = await supabase
      .from("time_logs")
      .select("duration_minutes")
      .eq("user_id", userId)
      .eq("date", today)

    if (data) {
      const total = data.reduce(
        (sum, row) => sum + (row.duration_minutes || 0),
        0
      )
      setTodayTotal(total)
    }
  }

  const start = async () => {
    if (!user || activeLog) return

    const today = new Date().toISOString().split("T")[0]

    const { data } = await supabase
      .from("time_logs")
      .insert([
        {
          user_id: user.id,
          date: today,
          start_time: new Date(),
        },
      ])
      .select()
      .single()

    setActiveLog(data)
  }

  const end = async () => {
    if (!activeLog) return

    const endTime = new Date()
    const startTime = new Date(activeLog.start_time)

    const durationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000
    )

    await supabase
      .from("time_logs")
      .update({
        end_time: endTime,
        duration_minutes: durationMinutes,
      })
      .eq("id", activeLog.id)

    setActiveLog(null)
    setElapsed(0)
    calculateToday(user.id)
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2,"0")}:${m
      .toString()
      .padStart(2,"0")}:${s.toString().padStart(2,"0")}`
  }

  const formatMinutes = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}h ${m}m`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black px-6">

      <div className="text-6xl font-bold mb-6">
        {activeLog ? formatTime(elapsed) : "00:00:00"}
      </div>

      {!activeLog ? (
        <button
          onClick={start}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl text-xl font-semibold"
        >
          START
        </button>
      ) : (
        <button
          onClick={end}
          className="w-full py-5 bg-red-600 text-white rounded-2xl text-xl font-semibold"
        >
          STOP
        </button>
      )}

      <div className="mt-8 text-sm text-gray-600">
        Today: {formatMinutes(todayTotal)}
      </div>

    </div>
  )
}
