function hexToRgb(hex: string) {
  if (hex.length === 4) {
    hex = '#' + [hex[1], hex[1], hex[2], hex[2], hex[3], hex[3]].join('');
  }
  let c = '0x' + hex.slice(1) as any;
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',');
}

const colors = {
  brand: [
    "#ffffff",
    "#C7E6D9",
    "#A7D5C0",
    "#88C3A9",
    "#61AF8C",
    "#4D9877",
    "#3A765C",
    "#285541",
    "#143427",
    "#001408",
  ],
  gray: [
    "#E2E2E2",
    "#B9B9B9",
    "#9D9D9D",
    "#838383",
    "#6D6D6D",
    "#5B5B5B",
    "#333333",
    "#252525",
    "#181818",
    "#000000",
  ],
  dark: [
    "#EDF0F8",
    "#e0e3ed",
    "#CACDD8",
    "#c3c6d1",
    "#858997",
    "#515768",
    "#2f3443",
    "#141821",
    "#0c0c0d",
    "#000000",
  ],
  yellow: [
    "#ffffff",
    "#F3E4B6",
    "#F0D172",
    "#F4C433",
    "#F6B900",
    "#BB8F0A",
    "#8E6F0F",
    "#6D5611",
    "#534311",
    "#403411",
  ],
  purple: [
    "#ffffff",
    "#e5e5ff",
    "#b4b4ff",
    "#8482fd",
    "#5351fb",
    "#2320f9",
    "#0c06df",
    "#0604ae",
    "#02037e",
    "#00014e",
  ],
  red: [
    "#ffffff",
    "#F3C6B6",
    "#F09372",
    "#F46533",
    "#F64000",
    "#BB380A",
    "#8E300F",
    "#6D2911",
    "#532311",
    "#401D11",
  ],
  gui_blue: [
    "#e9f3ff",
    "#ccdae5",
    "#b1bfcf",
    "#94a5b8",
    "#768ca2",
    "#5d7289",
    "#47596b",
    "#313f4e",
    "#1b2632",
    "#000000",
  ],
  green: [
    "#d8fff7",
    "#abffea",
    "#7bffde",
    "#41ecc1",
    "#00CD98",
    "#00b384",
    "#00805e",
    "#004e38",
    "#002d20",
    "#000",
  ]
} as const;
export const NORTECH_THEME = {
  colorScheme: "dark",
  loader: "oval",
  primaryColor: "brand",
  primaryShade: 4,
  fontFamily: "Jost",
  black: "#0c0c0d",

  colors,

  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 10px 15px -5px, rgba(0, 0, 0, 0.04) 0px 7px 7px -5px',
    md: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 20px 25px -5px, rgba(0, 0, 0, 0.04) 0px 10px 10px -5px',
    lg: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 28px 23px -7px, rgba(0, 0, 0, 0.04) 0px 12px 12px -7px',
    xl: '0 1px 3px rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0px 36px 28px -7px, rgba(0, 0, 0, 0.04) 0px 17px 17px -7px',
  },

  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  },

  radius: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 32,
  },

  spacing: {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },

  breakpoints: {
    xs: 576,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1400,
  },

  activeStyles: { transform: 'translateY(1px)' },

  other: {
    animationTime: {
      xs: 250,
      sm: 350,
      md: 450,
      lg: 550,
      xl: 750,
    },
  },
  colorsRgb: {

  } as { [key in keyof typeof colors]: string[] }
};

const colorsRgb = {} as { [key: string]: string[] }
for (const key in NORTECH_THEME["colors"]) {
  if (Object.prototype.hasOwnProperty.call(NORTECH_THEME["colors"], key)) {
    const colorsHex = NORTECH_THEME["colors"][key as keyof typeof colors];
    colorsRgb[key] = colorsHex.map(hexToRgb) as string[];
  }
}
NORTECH_THEME.colorsRgb = colorsRgb as any;
