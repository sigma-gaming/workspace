import { SVGProps } from 'react'

export const Vk = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <g clipPath="url(#clip0_269_11)">
        <mask
          id="mask0_269_11"
          style={{ maskType: 'luminance' }}
          width="24"
          height="24"
          x="0"
          y="0"
          maskUnits="userSpaceOnUse"
        >
          <path fill="#fff" d="M24 0H0v24h24V0z" />
        </mask>
        <g mask="url(#mask0_269_11)">
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M1.687 1.687C0 3.374 0 6.09 0 11.52v.96c0 5.43 0 8.146 1.687 9.833C3.374 24 6.09 24 11.52 24h.96c5.43 0 8.146 0 9.833-1.687C24 20.626 24 17.91 24 12.48v-.96c0-5.43 0-8.146-1.687-9.833C20.626 0 17.91 0 12.48 0h-.96C6.09 0 3.374 0 1.687 1.687zM4.145 7.8c.13 6.243 3.414 9.993 8.83 9.993h.314v-3.557c1.972.2 3.442 1.657 4.043 3.557h2.843c-.771-2.843-2.771-4.418-4.014-5.018 1.242-.743 3-2.532 3.414-4.975h-2.587c-.543 1.987-2.158 3.79-3.7 3.96V7.8h-2.629v6.927c-1.599-.4-3.686-2.341-3.771-6.927H4.145z"
            clipRule="evenodd"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_269_11">
          <path fill="#fff" d="M0 0H24V24H0z" />
        </clipPath>
      </defs>
    </svg>
  )
}
