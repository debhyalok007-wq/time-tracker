"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Home() {

  const [user, setUser] = useState<any>(null)
  const [activeLog, setActiveLog] = useState<any>(null)
  const [elapsed, setElapsed] = useState<number>(0)

  const [monthlyTotal, setMonthlyTotal] = useState<number>(0)
  const [todayTotal, setTodayTotal] = useState<number>(0)

  const [currentTime, setCurrentTime] = useState(new Date())

  const [showManual, setShowManual] = useState(false)
  const [manualStart, setManualStart] = useState("")
  const [manualEnd, setManualEnd] = useState("")
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  // ===== INIT =====
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      if (data.user) {
        checkActiveSession(data.user.id)
        calculateMonthlyTotal(data.user.id)
        calculateTodayTotal(data.user.id)
      }
    }

    init()
  }, [])

  // ===== LIVE CLOCK =====
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // ===== ACTIVE TIMER =====
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

  const checkActiveSession = async (userId: string) => {
    const { data } = await supabase
      .from("time_logs")
      .select("*")
      .eq("user_id", userId)
      .is("end_time", null)
      .maybeSingle()

    setActiveLog(data)
  }

  const calculateMonthlyTotal = async (userId: string) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data } = await supabase
      .from("time_logs")
      .select("duration_minutes")
      .eq("user_id", userId)
      .gte("date", firstDay.toISOString().split("T")[0])

    if (data) {
      const total = data.reduce(
        (sum, row) => sum + (row.duration_minutes || 0),
        0
      )
      setMonthlyTotal(total)
    }
  }

  const calculateTodayTotal = async (userId: string) => {
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

  const startWork = async () => {
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

  const endWork = async () => {
    if (!user || !activeLog) return

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

    await calculateMonthlyTotal(user.id)
    await calculateTodayTotal(user.id)
  }

  const saveManualTime = async () => {
    if (!user || !manualStart || !manualEnd) return

    const startDateTime = new Date(`${manualDate}T${manualStart}`)
    const endDateTime = new Date(`${manualDate}T${manualEnd}`)

    const durationMinutes = Math.round(
      (endDateTime.getTime() - startDateTime.getTime()) / 60000
    )

    await supabase.from("time_logs").insert([
      {
        user_id: user.id,
        date: manualDate,
        start_time: startDateTime,
        end_time: endDateTime,
        duration_minutes: durationMinutes,
      },
    ])

    setShowManual(false)
    setManualStart("")
    setManualEnd("")

    await calculateMonthlyTotal(user.id)
    await calculateTodayTotal(user.id)
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  const greeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "User"

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between">

      {/* TOP SECTION */}
      <div>

        <div className="flex justify-between text-gray-500">
          <span>{currentTime.toLocaleDateString("en-IN")}</span>
          <span>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        <h2 className="text-2xl font-serif text-center mt-6">
          {greeting()}, {firstName}
        </h2>

        <div
  className={`text-6xl font-extrabold text-center mt-10 transition-all duration-500 ${
    activeLog
      ? "text-black-700 timer-active"
      : "text-gray-400"
  }`}
>
          {activeLog ? formatTime(elapsed) : "00:00:00"}
        </div>

        <div className="mt-10">
          {!activeLog ? (
            <button
              onClick={startWork}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl text-lg font-semibold shadow-lg active:scale-95 transition"
            >
              START
            </button>
          ) : (
            <button
              onClick={endWork}
              className="w-full py-5 bg-red-600 text-white rounded-2xl text-lg font-semibold shadow-lg active:scale-95 transition"
            >
              END
            </button>
          )}
        </div>

        <button
          onClick={() => setShowManual(true)}
          className="mt-6 mx-auto block bg-orange-100 text-orange-600 px-6 py-2 rounded-full text-sm"
        >
          Enter Time Manually
        </button>

      </div>

      {/* BOTTOM SECTION */}
      <div className="space-y-4 mb-12">

        {/* TODAY CARD */}
        <div className="border border-gray-200 rounded-2xl p-4 flex justify-between">
          <span className="text-gray-500">Today</span>
          <span className="font-semibold">{formatMinutes(todayTotal)}</span>
        </div>

        {/* MONTH CARD */}
        <div className="border border-gray-200 rounded-2xl p-4 flex justify-between">
          <span className="text-gray-500">
            {new Date().toLocaleDateString("en-IN", { month: "long" })}
          </span>
          <span className="font-semibold">
            {formatMinutes(monthlyTotal)}
          </span>
        </div>

      </div>

      {/* MANUAL BOTTOM SHEET */}
      {showManual && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowManual(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>

            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3"
            />

            <input
              type="time"
              value={manualStart}
              onChange={(e) => setManualStart(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3"
            />

            <input
              type="time"
              value={manualEnd}
              onChange={(e) => setManualEnd(e.target.value)}
              className="w-full border rounded-lg p-2 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowManual(false)}
                className="flex-1 border rounded-lg py-2"
              >
                Cancel
              </button>

              <button
                onClick={saveManualTime}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}