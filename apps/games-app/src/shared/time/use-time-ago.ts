import dayjs from 'dayjs'
import plural from 'plural-ru'
import { useEffect, useState } from 'react'

function formatTime(date: string) {
  const seconds = dayjs().diff(dayjs(date), 'seconds')
  if (seconds < 5) return 'только что'
  if (seconds < 45)
    return plural(seconds, '%d секунда', '%d секунды', '%d секунд') + ' назад'
  const formatted = dayjs(date, { locale: 'ru' }).fromNow()
  if (formatted.includes('несколько секунд')) return 'только что'
  if (formatted === 'день назад') return 'вчера'
  return formatted
}

export function useTimeAgo(date: string) {
  const [formatted, setFormatted] = useState(() => formatTime(date))

  useEffect(() => {
    // In case if date is changed
    setFormatted(formatTime(date))

    const interval = setInterval(() => {
      setFormatted(formatTime(date))
    }, 1000)

    return () => clearInterval(interval)
  }, [date])

  return formatted
}
