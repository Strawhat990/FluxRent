import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FluxRent — Rent Anything. From Anyone.",
  description: "Rent anything from anyone around you — or earn from what you own. Cameras, cars, dresses, tools, speakers and more.",
  keywords: ["rent", "rental marketplace", "rent cameras", "rent cars", "peer to peer rental"],
  openGraph: {
    title: "FluxRent — Rent Anything. From Anyone.",
    description: "India's premier peer-to-peer rental marketplace.",
    type: "website",
    locale: "en_IN",
    siteName: "FluxRent",
  },
  twitter: {
    card: "summary_large_image",
    title: "FluxRent — Rent Anything. From Anyone.",
    description: "India's premier peer-to-peer rental marketplace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
