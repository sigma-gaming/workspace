import { NumberInput, NumberInputProps } from '@mantine/core'
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'

type GemInputProps = Omit<NumberInputProps, 'value' | 'onChange'> & {
  value: number
  onChange: (value: number) => void
}

export const GemInput = forwardRef<HTMLInputElement, GemInputProps>(
  ({ value, onChange, min = 100, max = Infinity, ...rest }, ref) => {
    const toString = (value: number) => {
      if (value === 0) return ''
      return value / 100
    }

    console.log(value, rest)

    const [internal, setInternal] = useState(() => toString(value))
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    useLayoutEffect(() => {
      onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
      if (value === 0 && internal === '') return
      setInternal(toString(value))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    useEffect(() => {
      let float =
        typeof internal === 'number' ? internal : Number.parseFloat(internal)
      if (Number.isNaN(float)) float = 0
      const gems = Math.floor(float * 100)
      onChangeRef.current(gems)
    }, [internal, onChangeRef])

    const handleBlur = () => {
      console.log('blur')
      if (value > max) onChangeRef.current(max)
      else if (value < min) onChangeRef.current(min)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        setInternal(String(Number(internal) + 1))
      } else if (e.key === 'ArrowDown') {
        setInternal(String(Number(internal) - 1))
      }
    }

    return (
      <NumberInput
        ref={ref}
        value={internal}
        onChange={setInternal}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        allowedDecimalSeparators={[',', '.']}
        decimalScale={2}
        step={1}
        min={min / 100}
        max={max / 100}
        thousandSeparator={' '}
        hideControls
        {...rest}
      />
    )
  },
)
