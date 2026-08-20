# Style Guide

This document outlines the design tokens used in the application, providing a centralized reference for colors, typography, spacing, and other visual elements.

## Colors

Colors are defined using HSL (Hue, Saturation, Lightness) values for flexibility and consistency across light and dark modes.

### Light Mode Palette

| Variable                 | HSL Value       | Description                               |
| :----------------------- | :-------------- | :---------------------------------------- |
| `--background`           | `210 20% 97%`   | Soft blue-gray, main background           |
| `--foreground`           | `210 20% 17%`   | Dark navy, main text color                |
| `--card`                 | `0 0% 100%`     | White, card background                    |
| `--card-foreground`      | `210 20% 17%`   | Dark navy, card text color                |
| `--popover`              | `0 0% 100%`     | White, popover background                 |
| `--popover-foreground`   | `210 20% 17%`   | Dark navy, popover text color             |
| `--primary`              | `210 90% 45%`   | Primary brand color                       |
| `--primary-foreground`   | `0 0% 100%`     | White, text on primary background         |
| `--secondary`            | `210 20% 97%`   | Secondary background color                |
| `--secondary-foreground` | `210 20% 17%`   | Dark navy, text on secondary background   |
| `--muted`                | `210 15% 92%`   | Muted background color                    |
| `--muted-foreground`     | `210 10% 45%`   | Muted text color                          |
| `--accent`               | `200 90% 94%`   | Light blue accent color                   |
| `--accent-foreground`    | `0 0% 100%`     | White, text on accent background          |
| `--destructive`          | `0 84.2% 60.2%` | Red, for destructive actions              |
| `--destructive-foreground`| `0 0% 98%`      | White, text on destructive background     |
| `--border`               | `210 20% 90%`   | Muted gray, border color                  |
| `--input`                | `210 10% 90%`   | Input field background                    |
| `--ring`                 | `210 90% 45%`   | Ring color for focus states               |
| `--chart-1`              | `12 76% 61%`    | Chart color 1                             |
| `--chart-2`              | `173 58% 39%`   | Chart color 2                             |
| `--chart-3`              | `197 37% 24%`   | Chart color 3                             |
| `--chart-4`              | `43 74% 66%`    | Chart color 4                             |
| `--chart-5`              | `27 87% 67%`    | Chart color 5                             |
| `--question`             | `210 20% 95%`   | Light blue-gray for question sections     |
| `--question-foreground`  | `210 20% 20%`   | Text color for question sections          |
| `--answer`               | `120 20% 95%`   | Light green-gray for answer sections      |
| `--answer-foreground`    | `120 20% 20%`   | Text color for answer sections            |
| `--diagnosis`            | `270 20% 95%`   | Light purple-gray for diagnosis sections  |
| `--diagnosis-foreground` | `270 20% 20%`   | Text color for diagnosis sections         |
| `--reasoning`            | `30 20% 95%`    | Light orange-gray for reasoning sections  |
| `--reasoning-foreground` | `30 20% 20%`    | Text color for reasoning sections         |
| `--sidebar-background`   | `210 20% 97%`   | Sidebar background                        |
| `--sidebar-foreground`   | `210 20% 17%`   | Sidebar text color                        |
| `--sidebar-primary`      | `210 90% 45%`   | Sidebar primary color                     |
| `--sidebar-primary-foreground`| `0 0% 100%`     | Text on sidebar primary background        |
| `--sidebar-accent`       | `200 90% 94%`   | Sidebar accent color                      |
| `--sidebar-accent-foreground`| `0 0% 100%`     | Text on sidebar accent background         |
| `--sidebar-border`       | `210 20% 90%`   | Sidebar border color                      |
| `--sidebar-ring`         | `210 90% 45%`   | Sidebar ring color                        |

### Dark Mode Palette

| Variable                 | HSL Value       | Description                               |
| :----------------------- | :-------------- | :---------------------------------------- |
| `--background`           | `210 20% 17%`   | Very dark slate, main background          |
| `--foreground`           | `210 20% 96%`   | Light gray-white, main text color         |
| `--card`                 | `210 20% 17%`   | Dark slate, card background               |
| `--card-foreground`      | `210 20% 96%`   | Light gray-white, card text color         |
| `--popover`              | `210 20% 17%`   | Dark slate, popover background            |
| `--popover-foreground`   | `210 20% 96%`   | Light gray-white, popover text color      |
| `--primary`              | `210 90% 60%`   | Primary brand color                       |
| `--primary-foreground`   | `222 47% 11%`   | Dark blue, text on primary background     |
| `--secondary`            | `217 30% 20%`   | Secondary background color                |
| `--secondary-foreground` | `210 20% 96%`   | Light gray-white, text on secondary background |
| `--muted`                | `217 25% 25%`   | Muted background color                    |
| `--muted-foreground`     | `215 25% 65%`   | Muted text color                          |
| `--accent`               | `170 60% 50%`   | Dim teal accent color                     |
| `--accent-foreground`    | `0 0% 98%`      | White, text on accent background          |
| `--destructive`          | `0 62.8% 30.6%` | Dark red, for destructive actions         |
| `--destructive-foreground`| `0 0% 98%`      | White, text on destructive background     |
| `--border`               | `210 20% 26%`   | Slightly lighter slate, border color      |
| `--input`                | `217 25% 25%`   | Input field background                    |
| `--ring`                 | `210 90% 60%`   | Ring color for focus states               |
| `--chart-1`              | `220 70% 50%`   | Chart color 1                             |
| `--chart-2`              | `160 60% 45%`   | Chart color 2                             |
| `--chart-3`              | `30 80% 55%`    | Chart color 3                             |
| `--chart-4`              | `280 65% 60%`   | Chart color 4                             |
| `--chart-5`              | `340 75% 55%`   | Chart color 5                             |
| `--question`             | `210 40% 25%`   | Deeper blue-gray for question sections    |
| `--question-foreground`  | `210 40% 90%`   | Text color for question sections          |
| `--answer`               | `140 40% 25%`   | Deeper green for answer sections          |
| `--answer-foreground`    | `140 40% 90%`   | Text color for answer sections            |
| `--diagnosis`            | `270 40% 25%`   | Deeper purple for diagnosis sections      |
| `--diagnosis-foreground` | `270 40% 90%`   | Text color for diagnosis sections         |
| `--reasoning`            | `40 40% 25%`    | Deeper gold/yellow for reasoning sections |
| `--reasoning-foreground` | `40 40% 90%`    | Text color for reasoning sections         |
| `--sidebar-background`   | `210 20% 17%`   | Sidebar background                        |
| `--sidebar-foreground`   | `210 20% 96%`   | Sidebar text color                        |
| `--sidebar-primary`      | `210 90% 60%`   | Sidebar primary color                     |
| `--sidebar-primary-foreground`| `222 47% 11%`   | Text on sidebar primary background        |
| `--sidebar-accent`       | `170 60% 50%`   | Sidebar accent color                      |
| `--sidebar-accent-foreground`| `0 0% 98%`      | Text on sidebar accent background         |
| `--sidebar-border`       | `210 20% 26%`   | Sidebar border color                      |
| `--sidebar-ring`         | `210 90% 60%`   | Sidebar ring color                        |

## Typography

| Property | Value             | Description       |
| :------- | :---------------- | :---------------- |
| Font Family | `Inter, sans-serif` | Primary font stack |

## Spacing Scale

Based on a 4px grid, providing consistent vertical and horizontal rhythm.

| Value | Pixels | Rem     |
| :---- | :----- | :------ |
| 1     | 4px    | 0.25rem |
| 2     | 8px    | 0.5rem  |
| 3     | 12px   | 0.75rem |
| 4     | 16px   | 1rem    |
| 5     | 20px   | 1.25rem |
| 6     | 24px   | 1.5rem  |
| 8     | 32px   | 2rem    |
| 10    | 40px   | 2.5rem  |
| 12    | 48px   | 3rem    |
| 16    | 64px   | 4rem    |

## Border Radius

Standardized border-radius values derived from `--radius`.

| Variable | Value                       |
| :------- | :-------------------------- |
| `--radius` | `0.5rem` (default)          |
| `sm`     | `calc(var(--radius) - 4px)` |
| `md`     | `calc(var(--radius) - 2px)` |
| `lg`     | `calc(var(--radius) - 0px)` |

## Shadows (Elevation Presets)

Standardized shadow values for consistent elevation.

| Variable | Value                                                                                             |
| :------- | :------------------------------------------------------------------------------------------------ |
| `sm`     | `0 1px 2px 0 rgba(0, 0, 0, 0.05)`                                                                 |
| `md`     | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`                            |
| `lg`     | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`                          |
| `xl`     | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`                        |
