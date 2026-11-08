import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Airbnb Concierge — an AI concierge for every stay",
    template: "%s · Airbnb Concierge",
  },
  description:
    "An AI hospitality concierge for short stays: verified property answers, personalised Barcelona recommendations, and maintenance requests that reach the host instantly.",
  openGraph: {
    title: "Airbnb Concierge",
    description:
      "Intelligent hospitality for every stay — powered by Claude.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrument.variable} ${bricolage.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
