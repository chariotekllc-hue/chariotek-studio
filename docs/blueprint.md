# **App Name**: Chariotek LLC

## Core Features:

- Homepage Hero Content: Display a compelling hero section with title, tagline, description, and dual CTAs, sourced from Firestore.
- Core Domains Grid: Showcase key domains (Aerospace & Robotics, Energy Systems, Engineering Design & Simulation, Software & AI) in a 4-column grid, populated from Firestore.
- About Page Content: Display mission, vision, team details, and core values (Precision, Integrity, Innovation, Accountability), sourced from static content or a CMS.
- Slogan Suggestion: Suggest different marketing slogans based on the page's content using AI as a tool.
- Conditional Layout: Conditionally renders Header/Footer. Excludes admin routes from main site layout
- Header: Sticky navigation bar with logo, company name, desktop & mobile menu, theme toggle, admin badge, and contact button.
- Footer: Displays social media links, copyright information, legal links, governing law notice, and an admin login link.
- UI Component Library: Based on shadcn/ui (Radix UI) - includes Button, Card, Input, Label, Badge, Dialog, Sheet, Dropdown Menu, Toast notifications, Tabs, Accordion, Separator with custom styling.
- Custom Hooks: Includes useFirestore, useUser, useAuth, useDoc, useCollection, useIsAdmin, useAdminRole, useContentService, and useMobile hooks.
- Responsive Design: Adapts grid layouts and typography for different screen sizes (Mobile, Tablet, Desktop, Large). Navigation uses a sheet drawer menu on mobile.

## Style Guidelines:

- Background color: Light grey background (#f5f5f7) to provide a clean and modern base.
- Foreground color: Dark grey text (#1d1d1f) to ensure high readability.
- Accent color: Apple Blue (#0071e3) to highlight key interactive elements.
- Primary font: 'Inter' (sans-serif) for a modern, readable aesthetic. Note: currently only Google Fonts are supported.
- Maximum content width: 980px for optimal readability, following Apple's reading width.
- Use symmetric, centered layouts.
- Subtle fade-in and scale-in animations with staggered delays to enhance user experience.