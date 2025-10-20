import "./globals.css";

export const metadata = {
  title: "Kalkulator wyceny breloczka 3D",
  description:
    "Orientacyjny kalkulator kosztów druku 3D breloczków z obsługą plików STL i logo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
