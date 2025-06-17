export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export type SpacingKeys = keyof typeof spacing;
export type SpacingValue = typeof spacing[SpacingKeys];

// Common layout values
export const layout = {
  maxWidth: 1200,
  containerPadding: spacing.md,
  headerHeight: 56,
  bottomTabHeight: 56,
  borderRadius: {
    small: spacing.xs,
    medium: spacing.sm,
    large: spacing.md,
    xlarge: spacing.lg,
    round: 9999,
  },
} as const;

export type LayoutKeys = keyof typeof layout;
export type LayoutValue = typeof layout[LayoutKeys]; 