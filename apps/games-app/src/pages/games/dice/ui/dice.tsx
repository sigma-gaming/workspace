import clsx from 'clsx'

interface DiceDotProps {
  className?: string
}

export const DiceDot = ({ className }: DiceDotProps) => {
  return (
    <span
      className={clsx(
        className,
        'absolute block min-w-2 min-h-2 w-[16%] h-[16%] rounded-full bg-[#1B1C2F]',
      )}
    />
  )
}

export interface DiceProps {
  className?: string
  side: number
  error?: boolean
}

export const Dice = ({ className, side, error }: DiceProps) => {
  return (
    <div
      className={clsx(
        className,
        'relative flex justify-center items-center w-full aspect-square rounded-[16%] select-none',
        error ? 'bg-red-200' : 'bg-white',
      )}
    >
      {side === 1 && (
        <DiceDot className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
      )}

      {side === 2 && (
        <>
          <DiceDot className="top-[30%] left-[30%]" />
          <DiceDot className="bottom-[30%] right-[30%]" />
        </>
      )}

      {side === 3 && (
        <>
          <DiceDot className="top-[22%] left-[22%]" />
          <DiceDot className="right-[22%] bottom-[22%]" />
          <DiceDot className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
        </>
      )}

      {side === 4 && (
        <>
          <DiceDot className="top-[24%] left-[24%]" />
          <DiceDot className="top-[24%] right-[24%]" />
          <DiceDot className="bottom-[24%] left-[24%]" />
          <DiceDot className="bottom-[24%] right-[24%]" />
        </>
      )}

      {side === 5 && (
        <>
          <DiceDot className="top-[22%] left-[22%]" />
          <DiceDot className="top-[22%] right-[22%]" />
          <DiceDot className="bottom-[22%] left-[22%]" />
          <DiceDot className="bottom-[22%] right-[22%]" />
          <DiceDot className="top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
        </>
      )}

      {side === 6 && (
        <>
          <DiceDot className="top-[18%] left-[24%]" />
          <DiceDot className="top-[18%] right-[24%]" />
          <DiceDot className="bottom-[18%] left-[24%]" />
          <DiceDot className="bottom-[18%] right-[24%]" />
          <DiceDot className="top-[50%] left-[24%] -translate-y-1/2" />
          <DiceDot className="top-[50%] right-[24%] -translate-y-1/2" />
        </>
      )}
    </div>
  )
}
