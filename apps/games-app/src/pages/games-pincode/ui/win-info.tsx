import { useUnit } from 'effector-react'
import { AnimatePresence, m, Variants } from 'framer-motion'
import { formatGem } from '../../../shared/lib/format/currency'
import { $$pincodePage } from '../model'

const container: Variants = {
  hidden: { transition: { staggerChildren: 0.2, staggerDirection: -1 } },
  visible: { transition: { staggerChildren: 0.1 } },
}

const child: Variants = {
  hidden: { opacity: 0, y: 10, transition: { ease: 'easeInOut' } },
  visible: { opacity: 1, y: 0, transition: { ease: 'easeInOut' } },
}

export const WinInfo = () => {
  const winInfo = useUnit($$pincodePage.$winInfo)

  return (
    <AnimatePresence>
      {winInfo && (
        <m.div
          className="absolute top-4 left-4 flex flex-col gap-1 sm:gap-1 font-medium"
          variants={container}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <m.span
            className="text-green-400 text-md sm:text-lg leading-none sm:leading-none text-opacity-75"
            variants={child}
          >
            + {formatGem(winInfo.amount / 100)}g
          </m.span>
          <m.span
            className="text-green-400 text-sm sm:text-base leading-none sm:leading-none text-opacity-50"
            variants={child}
          >
            {Math.round(winInfo.multiplier / 100)}x
          </m.span>
        </m.div>
      )}
    </AnimatePresence>
  )
}
