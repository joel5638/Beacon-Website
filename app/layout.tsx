import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
export const metadata: Metadata = {title:'Beacon Technology & AI Solutions | Enterprise AI & Software',description:'AI engineering, intelligent automation, data engineering, cloud and custom software solutions for growing businesses.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body>{children}<Analytics /></body></html>}
