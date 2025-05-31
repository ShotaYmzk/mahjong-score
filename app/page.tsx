"use client"; 

import MahjongLifeLogApp from "@/components/麻雀ライフログアプリ";
// import { ThemeProvider as CustomThemeProvider } from "@/contexts/ThemeContext"; // 不要になったので削除

export default function Home() {
  return (
    // CustomThemeProviderのラップを解除
    <MahjongLifeLogApp />
  );
}