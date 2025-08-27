import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Docker Cmd Studio",
  description: "Generate & store docker run commands",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}