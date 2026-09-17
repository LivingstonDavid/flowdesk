import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { WorkflowProvider } from "@/components/WorkflowProvider";

export const metadata: Metadata = {
  title: "Flowdesk - Agentic ITSM Workflow Builder",
  description:
    "Compose AI-assisted support workflows visually, run them over a live ticket queue, and measure the impact. Portfolio demo with 100% synthetic data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WorkflowProvider>
          <Nav />
          {children}
        </WorkflowProvider>
      </body>
    </html>
  );
}
