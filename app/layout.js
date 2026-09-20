import "./globals.css";

export const metadata = {
  title: "TraceLink — Understand Every Click",
  description: "Create trackable links and understand your audience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}