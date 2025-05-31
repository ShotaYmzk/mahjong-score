import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link"; // HeroUIのフッターで使用
import clsx from "clsx";

import { Providers } from "./providers"; // HeroUIProvider と NextThemesProvider を含む

// import { siteConfig } from "@/config/site"; // metadataで使用するため残す
import { fontSans } from "@/config/fonts";

// Navbarコンポーネントは削除したので、ここでのインポートは不要
// import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: "麻雀ライフログ",
    template: `%s - 麻雀ライフログ`,
  },
  description: "麻雀の対局を記録し、分析し、仲間とのコミュニケーションを活性化させるための革新的なWebアプリケーション",
  icons: {
    icon: "/favicon.ico", // public/favicon.ico を想定
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="ja">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col h-screen">
            {/* サイト全体のNavbarはここで配置しない (アプリ固有のNavbarを使用) */}
            <main className="flex-grow">
              {children} {/* ここに app/page.tsx の内容がレンダリングされる */}
            </main>
            <footer className="w-full flex items-center justify-center py-3 text-xs">
              <Link
                isExternal
                className="flex items-center gap-1 text-current"
                href="https://heroui.com?utm_source=mahjong-lifelog"
                title="heroui.com homepage"
              >
                <span className="text-default-600">Powered by</span>
                <p className="text-primary">HeroUI</p>
              </Link>
              <span className="text-default-600 mx-2">© {new Date().getFullYear()} 麻雀ライフログ</span>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}