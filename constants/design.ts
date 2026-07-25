export const FontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const Typography = {
  appTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: FontFamily.bold,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: FontFamily.bold,
  },
  pageTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FontFamily.semiBold,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: FontFamily.semiBold,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FontFamily.semiBold,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: FontFamily.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FontFamily.regular,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    fontFamily: FontFamily.semiBold,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: FontFamily.medium,
  },
} as const;

export const Spacing = {
  0: 0,
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
  48: 48,
  52: 52,
  60: 60,
  72: 72,
  screenHorizontal: 16,
  screenHorizontalWide: 20,
  cardPadding: 16,
  modalPadding: 20,
  sectionGap: 20,
  formGap: 14,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  card: 14,
  largeCard: 18,
  panel: 20,
  modal: 24,
  sheet: 26,
  pill: 999,
} as const;

export const BorderWidths = {
  hairline: 0.5,
  thin: 1,
  medium: 1.5,
  selected: 2,
} as const;

export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  modal: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const Controls = {
  minTouchTarget: 44,
  iconButton: 38,
  iconButtonLarge: 44,
  primaryButtonHeight: 48,
  tabBarHeight: 60,
  floatingActionButton: 52,
  inputMinHeight: 48,
} as const;

export const IconSizes = {
  tiny: 10,
  small: 14,
  medium: 18,
  large: 22,
  xlarge: 28,
  emptyState: 36,
  hero: 56,
} as const;

export const Motion = {
  fast: 180,
  standard: 220,
  slow: 300,
  entrance: 350,
} as const;

export const Breakpoints = {
  compactPhone: 390,
  largePhone: 430,
  tablet: 768,
  desktop: 1024,
} as const;

export const Layout = {
  contentMaxWidth: 480,
  wideContentMaxWidth: 720,
  webTopInset: 67,
  webBottomInset: 34,
  nativeBottomInsetFallback: 20,
} as const;

export const Design = {
  fontFamily: FontFamily,
  typography: Typography,
  spacing: Spacing,
  radii: Radii,
  borderWidths: BorderWidths,
  shadows: Shadows,
  controls: Controls,
  iconSizes: IconSizes,
  motion: Motion,
  breakpoints: Breakpoints,
  layout: Layout,
} as const;

export default Design;
