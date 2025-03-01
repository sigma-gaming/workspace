import http from 'k6/http'
import { Options } from 'k6/options'

const rate = 7500

export const options: Options = {
  discardResponseBodies: true,

  scenarios: {
    default: {
      executor: 'ramping-arrival-rate',
      timeUnit: '1s',
      startRate: rate,
      preAllocatedVUs: rate,
      stages: [
        // { target: rate / 2, duration: '5s' },
        { target: rate, duration: '5s' },
      ],
    },
  },
}

export default function () {
  http.get('http://localhost:8080/test')
}
