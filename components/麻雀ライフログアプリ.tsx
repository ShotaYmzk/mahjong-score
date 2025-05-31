"use client"; 

import React from 'react';
import { Tabs, Tab, Navbar as HeroNavbar, NavbarBrand, NavbarContent, Switch } from "@heroui/react";
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';
import { ScoreCalculator } from '@/components/ScoreCalculator';
import { Dashboard } from '@/components/Dashboard';
import { GameHistory } from '@/components/GameHistory';
import { AppProvider } from '@/contexts/AppContext';

const MahjongLifeLogApp: React.FC = () => { // ★ コンポーネント名を MahjongLifeLogApp に統一
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("calculator"); // ★ selectedTab の state をここで定義

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDarkMode = isMounted && theme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppProvider>
        <HeroNavbar isBordered maxWidth="xl" className="bg-content1">
          <NavbarBrand>
            <Icon icon="lucide:layers" className="text-primary text-2xl" />
            <p className="font-bold text-inherit ml-2">麻雀ライフログ</p>
          </NavbarBrand>
          <NavbarContent justify="end">
            <div className="flex items-center gap-2">
              <Icon icon={isDarkMode ? "lucide:moon" : "lucide:sun"} className="text-default-500" />
              <Switch 
                size="sm"
                isSelected={isDarkMode}
                onValueChange={toggleTheme}
                aria-label="ダークモード切替"
              />
            </div>
          </NavbarContent>
        </HeroNavbar>

        <div className="container mx-auto px-4 py-6">
          <Tabs 
            aria-label="メインナビゲーション" 
            selectedKey={selectedTab} 
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="mb-6"
            variant="underlined"
            color="primary"
          >
            <Tab 
              key="calculator" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:calculator" />
                  <span>スコア計算</span>
                </div>
              }
            >
              <ScoreCalculator />
            </Tab>
            <Tab 
              key="dashboard" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:bar-chart-2" />
                  <span>ダッシュボード</span>
                </div>
              }
            >
              <Dashboard />
            </Tab>
            <Tab 
              key="history" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:history" />
                  <span>対戦履歴</span>
                </div>
              }
            >
              <GameHistory />
            </Tab>
          </Tabs>
        </div>
      </AppProvider>
    </div>
  );
};

export default MahjongLifeLogApp; // ★ MahjongLifeLogApp をデフォルトエクスポート