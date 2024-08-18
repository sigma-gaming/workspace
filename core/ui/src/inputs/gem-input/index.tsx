import { NumberInput, NumberInputProps } from '@mantine/core'
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'

type GemInputProps = Omit<NumberInputProps, 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
}

export const GemInput = forwardRef<HTMLInputElement, GemInputProps>(
  ({ value, onChange, ...rest }, ref) => {
    const [string, setString] = useState(() => String(value / 100))
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    useLayoutEffect(() => {
      onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
      if (value === 0 && string === '') return
      setString(String(value / 100))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    useEffect(() => {
      let float = Number.parseFloat(string)
      if (Number.isNaN(float)) float = 0
      const gems = Math.floor(float * 100)
      onChangeRef.current(gems)
    }, [string, onChangeRef])

    return (
      <NumberInput
        ref={ref}
        value={string}
        onChange={(value) => setString(String(value))}
        allowedDecimalSeparators={[',', '.']}
        min={1}
        decimalScale={2}
        {...rest}
      />
    )
  },
)
