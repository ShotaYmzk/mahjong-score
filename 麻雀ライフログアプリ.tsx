import React from 'react';
import { Tabs, Tab, Navbar, NavbarBrand, NavbarContent, Switch, Button } from "@heroui/react";
import { Icon } from '@iconify/react';
import { ThemeContext } from './contexts/ThemeContext';
import { ScoreCalculator } from './components/ScoreCalculator';
import { Dashboard } from './components/Dashboard';
import { GameHistory } from './components/GameHistory';
import { AppProvider } from './contexts/AppContext';

const App: React.FC = () => {
  const { isDarkMode, toggleTheme } = React.useContext(ThemeContext);
  const [selected, setSelected] = React.useState("calculator");

  return (
    <div className="min-h-screen bg-background">
      <AppProvider>
        <Navbar isBordered maxWidth="xl" className="bg-content1">
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
        </Navbar>

        <div className="container mx-auto px-4 py-6">
          <Tabs 
            aria-label="メインナビゲーション" 
            selectedKey={selected} 
            onSelectionChange={setSelected as any}
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
}

export default App;