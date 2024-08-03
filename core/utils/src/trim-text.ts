export function trimText<T extends string | null | undefined>(
  text: T,
  maxLength: number,
  end = '…',
): T {
  if (!text && text !== '') return text as T
  const cut =
    text.length > maxLength ? `${text.slice(0, maxLength)}${end}` : text
  return cut as T
}
