import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Kinetic Academy",
  description: "AI-powered university admission preparation for Bangladesh.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
