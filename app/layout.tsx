import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { WorkflowProvider } from "@/components/WorkflowProvider";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Flowdesk - Agentic ITSM Workflow Builder",
  description:
    "Compose AI-assisted support workflows visually, run them over a live ticket queue, and measure the impact. Portfolio demo with 100% synthetic data.",
};

export const viewport: Viewport = {
  themeColor: "#07090d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <WorkflowProvider>
          <Shell>{children}</Shell>
        </WorkflowProvider>
      </body>
    </html>
  );
}
