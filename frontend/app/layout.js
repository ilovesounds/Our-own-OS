import "./globals.css";

export const metadata = {
  title: "Kratos OS — The Agentic Sandbox",
  description: "Futuristic 6-core LangGraph orchestration container with Chaos stress test injection and time-travel ledger recovery.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@300;400;500;700&family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
