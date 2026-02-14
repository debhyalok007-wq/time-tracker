"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Reports() {

  const [user, setUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const [dailyTotals, setDailyTotals] = useState<Record<string, number>>({})
  const [logsByDate, setLogsByDate] = useState<Record<string, any[]>>({})
  const [yearlyTotals, setYearlyTotals] = useState<number[]>(Array(12).fill(0))

  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<any[]>([])

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)

      if (data.user) {
        fetchMonthlyData(data.user.id, selectedDate)
        fetchYearlyData(data.user.id, selectedYear)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (user) fetchMonthlyData(user.id, selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (user) fetchYearlyData(user.id, selectedYear)
  }, [selectedYear])

  // ===== FETCH MONTHLY =====
  const fetchMonthlyData = async (userId: string, dateObj: Date) => {
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth()

    const firstDay = formatDateKey(year, month, 1)
    const lastDay = formatDateKey(
      year,
      month,
      new Date(year, month + 1, 0).getDate()
    )

    const { data } = await supabase
      .from("time_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", firstDay)
      .lte("date", lastDay)

    if (data) {
      const grouped: Record<string, number> = {}
      const byDate: Record<string, any[]> = {}

      data.forEach((row) => {
        const dateKey = row.date
        grouped[dateKey] =
          (grouped[dateKey] || 0) + (row.duration_minutes || 0)

        if (!byDate[dateKey]) byDate[dateKey] = []
        byDate[dateKey].push(row)
      })

      setDailyTotals(grouped)
      setLogsByDate(byDate)
    }
  }

  // ===== FETCH YEARLY =====
  const fetchYearlyData = async (userId: string, year: number) => {
    const firstDay = `${year}-01-01`
    const lastDay = `${year}-12-31`

    const { data } = await supabase
      .from("time_logs")
      .select("date, duration_minutes")
      .eq("user_id", userId)
      .gte("date", firstDay)
      .lte("date", lastDay)

    if (data) {
      const monthlyTotals = Array(12).fill(0)

      data.forEach((row) => {
        const monthIndex = Number(row.date.split("-")[1]) - 1
        monthlyTotals[monthIndex] += row.duration_minutes || 0
      })

      setYearlyTotals(monthlyTotals)
    }
  }

  const changeMonth = (offset: number) => {
    setSelectedDate(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + offset,
        1
      )
    )
  }

  const changeYear = (offset: number) => {
    setSelectedYear((prev) => prev + offset)
  }

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs}h ${mins}m`
  }

  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const lastDate = new Date(year, month + 1, 0).getDate()

  // ===== MONTH SUMMARY CALC =====
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year &&
    today.getMonth() === month

  const lastDayToCheck = isCurrentMonth
    ? today.getDate()
    : lastDate

  let totalMinutes = 0
  let workingDays = 0
  let nonWorkingDays = 0
  let extraDaysCount = 0
  let extraMinutes = 0

  for (let day = 1; day <= lastDayToCheck; day++) {

    const dateKey = formatDateKey(year, month, day)
    const minutes = dailyTotals[dateKey] || 0
    const dayOfWeek = new Date(year, month, day).getDay()

    totalMinutes += minutes

    if (minutes > 0) workingDays++
    if (minutes === 0 && dayOfWeek !== 0) nonWorkingDays++

    if (dayOfWeek === 0 && minutes > 0) {
      extraDaysCount++
      extraMinutes += minutes
    }
  }

  return (
    <div className="w-full">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ===== MONTH SECTION ===== */}
        <div className="lg:col-span-2">

          <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4">

            {/* Month Selector */}
            <div className="flex justify-between items-center mb-6">

              <button
                onClick={() => changeMonth(-1)}
                className="w-10 h-10 bg-gray-100 rounded-[8px] flex items-center justify-center active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>

              <h2 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric"
                })}
              </h2>

              <button
                onClick={() => changeMonth(1)}
                className="w-10 h-10 bg-gray-100 rounded-[8px] flex items-center justify-center active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-sm">

                <div>
                  <p className="text-gray-500">Total Hours</p>
                  <p className="font-semibold">
                    {formatMinutes(totalMinutes)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Working Days</p>
                  <p className="font-semibold">
                    {workingDays}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Non-Working Days</p>
                  <p className="font-semibold">
                    {nonWorkingDays}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Extra Days</p>
                  <p className="font-semibold text-red-600">
                    {extraDaysCount > 0
                      ? `${extraDaysCount} Days (${formatMinutes(extraMinutes)})`
                      : "0 Days"}
                  </p>
                </div>

              </div>
            </div>

            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => (
                <div
                  key={day}
                  className={day === "Sun" ? "text-red-500" : "text-gray-500"}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">

              {(() => {
                const firstDayIndex = new Date(year, month, 1).getDay()
                const days = []

                for (let i = 0; i < firstDayIndex; i++) {
                  days.push(<div key={"empty-" + i}></div>)
                }

                for (let day = 1; day <= lastDate; day++) {

                  const dateKey = formatDateKey(year, month, day)
                  const minutes = dailyTotals[dateKey] || 0
                  const dayOfWeek = new Date(year, month, day).getDay()

                  days.push(
                    <div
                      key={day}
                      onClick={() => {
                        if (minutes > 0) {
                          setSelectedDay(dateKey)
                          setSelectedLogs(logsByDate[dateKey] || [])
                        }
                      }}
                      className="bg-white border border-gray-200 rounded-md p-1 h-16 flex flex-col justify-between text-xs cursor-pointer hover:bg-gray-100"
                    >
                      <span className={dayOfWeek === 0 ? "text-red-500" : "text-gray-500"}>
                        {day}
                      </span>

                      {minutes > 0 && (
                        <span className="text-blue-600 font-medium">
                          {formatMinutes(minutes)}
                        </span>
                      )}
                    </div>
                  )
                }

                return days
              })()}

            </div>
          </div>
        </div>

        {/* ===== YEAR SECTION ===== */}
        <div>

          <div>

            <div className="flex justify-between items-center mb-6">

              <button
                onClick={() => changeYear(-1)}
                className="w-10 h-10 bg-gray-100 rounded-[8px] flex items-center justify-center active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>

              <h3 className="font-semibold text-lg">
                {selectedYear}
              </h3>

              <button
                onClick={() => changeYear(1)}
                className="w-10 h-10 bg-gray-100 rounded-[8px] flex items-center justify-center active:scale-95 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>

            </div>

            <div className="grid grid-cols-3 gap-2">
              {yearlyTotals.map((total, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-md p-3 text-center text-xs"
                >
                  <p className="text-gray-500">
                    {new Date(0, index).toLocaleString("en-IN", { month: "short" })}
                  </p>
                  <p className="font-medium">
                    {formatMinutes(total)}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ===== DAY DETAILS SHEET ===== */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl p-6 max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4">
              {new Date(selectedDay).toLocaleDateString("en-IN")}
            </h3>

            {selectedLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-md p-3 mb-3 text-sm"
              >
                <div className="flex justify-between">
                  <span>
                    {new Date(log.start_time).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                    {" - "}
                    {new Date(log.end_time).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>

                  <span className="font-medium">
                    {formatMinutes(log.duration_minutes || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}