import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ee" },
    { media: "(prefers-color-scheme: dark)", color: "#10100d" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Leasify - Rent Anything. From Anyone.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leasify - Rent Anything. From Anyone.",
    description: "India's premier peer-to-peer rental marketplace.",
    images: ["/og-image.png"],
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
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
