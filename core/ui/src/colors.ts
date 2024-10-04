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
  green: color([
    '#ebfbee',
    '#d3f9d8',
    '#b2f2bb',
    '#8ce99a',
    '#69db7c',
    '#51cf66',
    '#40c057',
    '#37b24d',
    '#2f9e44',
    '#2b8a3e',
  ]),
  red: color([
    '#fff5f5',
    '#ffe3e3',
    '#ffc9c9',
    '#ffa8a8',
    '#ff8787',
    '#ff6b6b',
    '#fa5252',
    '#f03e3e',
    '#e03131',
    '#c92a2a',
  ]),
}

const shadeMap: Record<number, number> = {
  0: 50,
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
  6: 600,
  7: 700,
  8: 800,
  9: 900,
  10: 950,
}

export const tailwindColors = Object.fromEntries(
  Object.entries(colors).map(([key, color]) => [
    key,
    Object.fromEntries(color.map((hex, index) => [shadeMap[index], hex])),
  ]),
) as {
  [key in keyof typeof colors]: Record<string, string>
}
