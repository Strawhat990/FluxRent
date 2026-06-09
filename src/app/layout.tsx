import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leasify - Rent Anything. From Anyone.",
  description:
    "Rent anything from anyone around you, or earn from what you own. Cameras, cars, dresses, tools, speakers and more.",
  keywords: ["rent", "rental marketplace", "rent cameras", "rent cars", "peer to peer rental"],
  openGraph: {
    title: "Leasify - Rent Anything. From Anyone.",
    description: "India's premier peer-to-peer rental marketplace.",
    type: "website",
    locale: "en_IN",
    siteName: "Leasify",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leasify - Rent Anything. From Anyone.",
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
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=cabinet-grotesk@300,400,500,700,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
