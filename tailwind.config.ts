
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
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: '#3A86FF',
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#8338EC',
					foreground: '#FFFFFF'
				},
				success: {
					DEFAULT: '#06D6A0',
					foreground: '#FFFFFF'
				},
				warning: {
					DEFAULT: '#FFD166',
					foreground: '#212529'
				},
				danger: {
					DEFAULT: '#EF476F',
					foreground: '#FFFFFF'
				},
				muted: {
					DEFAULT: '#F8F9FA',
					foreground: '#6C757D'
				},
				accent: {
					DEFAULT: '#8338EC',
					foreground: '#FFFFFF'
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
					foreground: '#212529',
					primary: '#3A86FF',
					'primary-foreground': '#FFFFFF',
					accent: '#F8F9FA',
					'accent-foreground': '#212529',
					border: '#DDE2E5',
					ring: '#3A86FF'
				}
			},
			borderRadius: {
				lg: '12px',
				md: '8px',
				sm: '4px'
			},
			fontSize: {
				'h1': ['28px', '36px'],
				'h2': ['24px', '32px'],
				'h3': ['20px', '28px'],
				'h4': ['18px', '24px'],
				'body': ['16px', '24px'],
				'small': ['14px', '20px'],
				'micro': ['12px', '16px'],
			},
			boxShadow: {
				'card': '0px 4px 12px rgba(0, 0, 0, 0.08)',
			},
			keyframes: {
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
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
