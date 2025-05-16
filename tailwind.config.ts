
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			animation: {
				'wave-pulse': 'wave-pulse 4s ease-in-out infinite',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
			},
			keyframes: {
				'wave-pulse': {
					'0%, 100%': { opacity: 0.4 },
					'50%': { opacity: 0.7 },
				},
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
					},
					'100%': {
						opacity: '1',
					},
				},
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#191919', // More Notion-like neutral dark color
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#6B7280', // Subtle gray
					foreground: '#FFFFFF'
				},
				success: {
					DEFAULT: '#10B981', // Softer green
					foreground: '#FFFFFF'
				},
				warning: {
					DEFAULT: '#F59E0B', // Softer amber
					foreground: '#FFFFFF'
				},
				danger: {
					DEFAULT: '#EF4444', // Softer red
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#F9FAFB', // Lighter gray background
					foreground: '#6B7280'
				},
				accent: {
					DEFAULT: '#E5E7EB', // Light gray accent
					foreground: '#111827'
				},
				coral: {
					50: '#FFF5F2',
					100: '#FFEAE5',
					200: '#FFDAD1',
					300: '#FFC5B8',
					400: '#FFAD99',
					500: '#F97316', // Main coral color
					600: '#E25F27',
					700: '#C8451E',
					800: '#A43116',
					900: '#832710',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: '#FFFFFF',
					foreground: '#111827',
					primary: '#191919',
					'primary-foreground': '#FFFFFF',
					accent: '#F9FAFB',
					'accent-foreground': '#111827',
					border: '#F3F4F6',
					ring: '#191919'
				}
			},
			borderRadius: {
				lg: '8px',     // Reduced from 12px
				md: '6px',     // Reduced
				sm: '4px'      // Kept the same
			},
			fontSize: {
				'h1': ['24px', '32px'],     // Slightly smaller
				'h2': ['20px', '28px'],     // Slightly smaller
				'h3': ['18px', '26px'],     // Slightly smaller
				'h4': ['16px', '24px'],     // Slightly smaller
				'body': ['14px', '22px'],   // Slightly smaller
				'small': ['13px', '20px'],  // Slightly smaller
				'micro': ['12px', '16px'],  // Kept the same
			},
			boxShadow: {
				'card': '0px 1px 3px rgba(0, 0, 0, 0.05)',  // Much subtler shadow
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
