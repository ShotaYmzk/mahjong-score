import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Player {
  id: string;
  name: string;
}

export interface PlayerScore {
  playerId: string;
  name: string;
  rawScore: number;
  rank?: number;
  okaPoints?: number; // ウマの点数として使用
  finalScore?: number;
  okaBonus?: number; // オカのトップ賞額 (トッププレイヤーのみ)
}

export interface GameSettings {
  startingPoints: number;
  returnPoints: number;
  uma: string; // 例: "なし", "5-10", "10-20", "10-30"
}

export interface UmaSettings {
  [key: string]: number[]; // 例: "5-10": [10, 5, -5, -10]
}

export interface GameExpense {
  type: string;
  amount: number;
  paymentMethod: 'split' | 'winner' | 'loser'; // 割り勘、トップ払い、ラス払い
}

export interface GameHighlight {
  text: string;
  type: 'normal' | 'yakuman' | 'comeback' | 'other';
  playerId?: string; // 関連プレイヤーID
}

export interface GameRecord {
  id: string;
  date: string; // ISO string
  players: PlayerScore[];
  settings: GameSettings;
  expenses?: GameExpense[];
  highlights?: GameHighlight[];
  tags?: string[];
  venue?: string;
  sessionId?: string; // 連続対局機能用
}

export interface Achievement {
  id: string;
  playerId: string;
  title: string;
  description: string;
  icon: string; // iconify icon name
  date: string; // ISO string
}

export interface PlayerStats {
  playerId: string;
  name: string;
  totalGames: number;
  totalPoints: number;
  averageRank: number;
  firstPlaceCount: number;
  secondPlaceCount: number;
  lastPlaceCount: number;
  firstPlaceRate: number;
  topTwoRate: number;
  notLastRate: number;
  achievements: Achievement[];
  yakumanCount: number;
}

export interface HeadToHeadRecord {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  pointsDifference: number;
}

// 連続対局機能用
export interface GameSession {
  id: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  players: Player[]; // このセッションの参加プレイヤー
  settings: GameSettings; // このセッションの基本ルール
  gameRecordsInSession: GameRecord[]; // このセッション内の各半荘の記録
  status: 'active' | 'completed';
  currentRound: number; // 現在の半荘数 (1から開始)
  name?: string; // 対局会の名前 (例: "週末麻雀会")
}