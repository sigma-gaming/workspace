type Color = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]

const color = (color: Color) => color

export const colors = {
  primary: color([
    '#f8ecff',
    '#ead7f9',
    '#d0adee',
    '#ad6ddf',
    '#a15ada',
    '#9341d5',
    '#8c35d3',
    '#7928bb',
    '#6b22a8',
    '#5d1a94',
  ]),
}

export const tailwindColors = Object.fromEntries(
  Object.entries(colors).map(([key, color]) => [
    key,
    Object.fromEntries(color.map((hex, index) => [index, hex])),
  ]),
) as {
  [key in keyof typeof colors]: Record<string, string>
}
