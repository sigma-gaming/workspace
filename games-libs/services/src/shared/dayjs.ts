import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween.js'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)

export { dayjs }
