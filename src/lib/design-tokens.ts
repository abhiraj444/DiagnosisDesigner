export const colors = {
  light: {
    background: "210 20% 97%", // #F5F7FA - Soft blue-gray
    foreground: "210 20% 17%", // #1F2937 - Dark navy
    card: "0 0% 100%",
    "card-foreground": "210 20% 17%",
    popover: "0 0% 100%",
    "popover-foreground": "210 20% 17%",
    primary: "210 90% 45%",
    "primary-foreground": "0 0% 100%",
    secondary: "210 20% 97%",
    "secondary-foreground": "210 20% 17%",
    muted: "210 15% 92%",
    "muted-foreground": "210 10% 45%",
    accent: "200 90% 94%", // #E0F2FE - Light blue accent
    "accent-foreground": "0 0% 100%",
    destructive: "0 84.2% 60.2%",
    "destructive-foreground": "0 0% 98%",
    border: "210 20% 90%", // #D9E2EC - Muted gray
    input: "210 10% 90%",
    ring: "210 90% 45%",
    "chart-1": "12 76% 61%",
    "chart-2": "173 58% 39%",
    "chart-3": "197 37% 24%",
    "chart-4": "43 74% 66%",
    "chart-5": "27 87% 67%",
    question: "210 20% 95%", // Light blue-gray for question
    "question-foreground": "210 20% 20%",
    answer: "120 20% 95%", // Light green-gray for answer
    "answer-foreground": "120 20% 20%",
    diagnosis: "270 20% 95%", // Light purple-gray for diagnosis
    "diagnosis-foreground": "270 20% 20%",
    reasoning: "30 20% 95%", // Light orange-gray for reasoning
    "reasoning-foreground": "30 20% 20%",
    "sidebar-background": "210 20% 97%", // Inherit from background for light mode
    "sidebar-foreground": "210 20% 17%", // Inherit from foreground for light mode
    "sidebar-primary": "210 90% 45%",
    "sidebar-primary-foreground": "0 0% 100%",
    "sidebar-accent": "200 90% 94%",
    "sidebar-accent-foreground": "0 0% 100%",
    "sidebar-border": "210 20% 90%",
    "sidebar-ring": "210 90% 45%",
  },
  dark: {
    background: "210 20% 17%", // #1E293B - Very dark slate or blue-gray
    foreground: "210 20% 96%", // #F1F5F9 - Light gray-white
    card: "210 20% 17%",
    "card-foreground": "210 20% 96%",
    popover: "210 20% 17%",
    "popover-foreground": "210 20% 96%",
    primary: "210 90% 60%",
    "primary-foreground": "222 47% 11%",
    secondary: "217 30% 20%",
    "secondary-foreground": "210 20% 96%",
    muted: "217 25% 25%",
    "muted-foreground": "215 25% 65%",
    accent: "170 60% 50%", // #2DD4BF - Dim teal
    "accent-foreground": "0 0% 98%",
    destructive: "0 62.8% 30.6%",
    "destructive-foreground": "0 0% 98%",
    border: "210 20% 26%", // #334155 - Slightly lighter slate
    input: "217 25% 25%",
    ring: "210 90% 60%",
    "chart-1": "220 70% 50%",
    "chart-2": "160 60% 45%",
    "chart-3": "30 80% 55%",
    "chart-4": "280 65% 60%",
    "chart-5": "340 75% 55%",
    question: "210 40% 25%", // Deeper Blue-Gray
    "question-foreground": "210 40% 90%",
    answer: "140 40% 25%", // Deeper Green
    "answer-foreground": "140 40% 90%",
    diagnosis: "270 40% 25%", // Deeper Purple
    "diagnosis-foreground": "270 40% 90%",
    reasoning: "40 40% 25%", // Deeper Gold/Yellow
    "reasoning-foreground": "40 40% 90%",
    "sidebar-background": "210 20% 17%", // Inherit from background for dark mode
    "sidebar-foreground": "210 20% 96%", // Inherit from foreground for dark mode
    "sidebar-primary": "210 90% 60%",
    "sidebar-primary-foreground": "222 47% 11%",
    "sidebar-accent": "170 60% 50%",
    "sidebar-accent-foreground": "0 0% 98%",
    "sidebar-border": "210 20% 26%",
    "sidebar-ring": "210 90% 60%",
  },
};

export const fonts = {
  sans: "Inter, sans-serif",
};

export const spacing = {
  "1": "0.25rem", // 4px
  "2": "0.5rem",  // 8px
  "3": "0.75rem", // 12px
  "4": "1rem",    // 16px
  "5": "1.25rem", // 20px
  "6": "1.5rem",  // 24px
  "8": "2rem",    // 32px
  "10": "2.5rem", // 40px
  "12": "3rem",   // 48px
  "16": "4rem",   // 64px
};

export const borderRadius = {
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "calc(var(--radius) - 0px)",
  DEFAULT: "0.5rem", // This corresponds to --radius
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};
