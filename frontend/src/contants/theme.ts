import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#8E27D7',
      light: '#4a79c7',
      dark: '#FF5712',
      200: 'rgba(185, 36, 255, 0.18)',
      100: '#d4e3ff',
      50: '#FB5C51',
    },

    secondary: {
      main: '#e0cc00',
      dark: '#a8a8a8',
    },
    info: {
      main: '#FDB447',
    },
    text: {
      primary: 'rgba(51,51,51,0.87)',
    },
    grey: {
      100: '#F9FAFB',
      200: '#F4F6F8',
      300: '#DFE3E8',
      400: '#C4CDD5',
      500: '#919EAB',
      600: '#637381',
      700: '#454F5B',
      800: '#212B36',
      900: '#161C24',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter',
    h1: {
      fontSize: 28,
      fontWeight: 500,
    },
    h2: {
      fontSize: 22,
      fontWeight: 400,
    },
    h3: {
      fontSize: 20,
      fontWeight: 500,
    },
    h4: {
      fontSize: 20,
      fontWeight: 300,
    },
    body1: {
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.25,
    },
    body2: {
      fontSize: 14,
      fontWeight: 400,
    },
    h5: {
      fontSize: 18,
      fontWeight: 500,
    },
    h6: {
      fontSize: 19,
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: 13,
      fontWeight: 300,
      lineHeight: 1.12,
    },
    overline: {
      fontSize: 13,
      fontWeight: 300,
    },
  },
  spacing: 8,
})

export { theme }
