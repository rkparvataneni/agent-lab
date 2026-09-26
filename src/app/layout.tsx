import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agentic Lab",
    template: "%s · Agentic Lab",
  },
  description:
    "Hand-code agents, then control hallucination, sampling parameters, rate limits, and the graph around them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
