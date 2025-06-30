import "./globals.css";
import type { Metadata } from "next";
import { AppProvider } from "@/Provider";

export const metadata: Metadata = {
  title: "Publications View",
  description:
    "A modern platform for viewing and managing academic publications",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
