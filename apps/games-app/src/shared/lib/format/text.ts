export function cutLongText<T extends string | null | undefined>(
  text: T,
  maxLength: number,
): T {
  if (!text && text !== '') return text as T
  const cut = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  return cut as T
}
