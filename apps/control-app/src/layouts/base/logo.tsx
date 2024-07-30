import { SVGProps } from 'react'

export const Logo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="7" cy="8" r="4.5" stroke="#FA00FF" strokeWidth="3" />
      <path
        d="M13.5 3.5L7.5 3.5H7.02494C4.33453 3.5 2.23229 5.82295 2.5 8.5V8.5"
        stroke="url(#paint0_linear_4_4)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_4_4"
          x1="7"
          y1="3.5"
          x2="2.5"
          y2="8.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B00E4" />
          <stop offset="1" stopColor="#9B00E4" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
