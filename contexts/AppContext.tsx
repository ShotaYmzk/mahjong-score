"use client";

import React from 'react';
import { 
  Player, 
  GameRecord, 
  GameSettings, 
  PlayerScore, 
  Achievement, 
  UmaSettings,
  GameSession
} from '../types';
import { addToast } from '@heroui/react';

interface AppContextType {
  players: Player[];
  gameRecords: GameRecord[];
  achievements: Achievement[];
  gameSessions: GameSession[];
  activeSession: GameSession | null;
  isContextLoaded: boolean; // ★ ここに isContextLoaded を追加
  addPlayer: (name: string) => Player | undefined;
  addGameRecord: (record: GameRecord) => void;
  updateGameRecord: (id: string, record: GameRecord) => void;
  deleteGameRecord: (id: string) => void;
  getPlayerById: (id: string) => Player | undefined;
  getDefaultSettings: () => GameSettings;
  getUmaValues: (umaType: string) => number[];
  calculateRanks: (scores: PlayerScore[]) => PlayerScore[];
  calculateFinalScores: (scores: PlayerScore[], settings: GameSettings) => PlayerScore[];
  startNewSession: (sessionName: string, players: Player[], settings: GameSettings) => GameSession | null;
  addGameToActiveSession: (rawScores: { playerId: string, name: string, rawScore: number }[]) => void;
  completeActiveSession: () => void;
  getActiveSessionSummary: () => PlayerScore[] | null;
  deleteSession: (sessionId: string) => void;
}

export const AppContext = React.createContext<AppContextType>({
  players: [],
  gameRecords: [],
  achievements: [],
  gameSessions: [],
  activeSession: null,
  isContextLoaded: false, // ★ 初期値にも isContextLoaded を追加
  addPlayer: () => undefined,
  addGameRecord: () => {},
  updateGameRecord: () => {},
  deleteGameRecord: () => {},
  getPlayerById: () => undefined,
  getDefaultSettings: () => ({ startingPoints: 25000, returnPoints: 30000, uma: '10-30' }),
  getUmaValues: () => [0, 0, 0, 0],
  calculateRanks: (scores) => scores,
  calculateFinalScores: (scores) => scores,
  startNewSession: () => null,
  addGameToActiveSession: () => {},
  completeActiveSession: () => {},
  getActiveSessionSummary: () => null,
  deleteSession: () => {},
});


interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [gameRecords, setGameRecords] = React.useState<GameRecord[]>([]);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [gameSessions, setGameSessions] = React.useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = React.useState<GameSession | null>(null);
  const [isContextLoaded, setIsContextLoaded] = React.useState(false);

  React.useEffect(() => {
    let didCancel = false;

    const loadDataFromLocalStorage = () => {
      if (typeof window !== 'undefined' && !didCancel) {
        try {
          const savedPlayers = localStorage.getItem('mahjong-players');
          if (savedPlayers) setPlayers(JSON.parse(savedPlayers));

          const savedRecords = localStorage.getItem('mahjong-game-records');
          if (savedRecords) setGameRecords(JSON.parse(savedRecords));

          const savedAchievements = localStorage.getItem('mahjong-achievements');
          if (savedAchievements) setAchievements(JSON.parse(savedAchievements));

          const savedSessions = localStorage.getItem('mahjong-game-sessions');
          if (savedSessions) setGameSessions(JSON.parse(savedSessions));
          
          const savedActiveSession = localStorage.getItem('mahjong-active-session');
          if (savedActiveSession && savedActiveSession !== "null") {
             setActiveSession(JSON.parse(savedActiveSession));
          } else {
             setActiveSession(null);
          }

        } catch (error) {
          console.error("Failed to parse data from localStorage", error);
        } finally {
          if (!didCancel) {
            setIsContextLoaded(true);
          }
        }
      }
    };

    loadDataFromLocalStorage();

    return () => {
      didCancel = true;
    };
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && isContextLoaded) {
      localStorage.setItem('mahjong-players', JSON.stringify(players));
    }
  }, [players, isContextLoaded]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && isContextLoaded) {
      localStorage.setItem('mahjong-game-records', JSON.stringify(gameRecords));
    }
  }, [gameRecords, isContextLoaded]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && isContextLoaded) {
      localStorage.setItem('mahjong-achievements', JSON.stringify(achievements));
    }
  }, [achievements, isContextLoaded]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && isContextLoaded) {
      localStorage.setItem('mahjong-game-sessions', JSON.stringify(gameSessions));
    }
  }, [gameSessions, isContextLoaded]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && isContextLoaded) {
      if (activeSession) {
        localStorage.setItem('mahjong-active-session', JSON.stringify(activeSession));
      } else {
        localStorage.removeItem('mahjong-active-session');
      }
    }
  }, [activeSession, isContextLoaded]);

  const addPlayer = (name: string): Player | undefined => {
    if (!name.trim()) return undefined;
    const trimmedName = name.trim();
    const existingPlayer = players.find(p => p.name === trimmedName);
    if (existingPlayer) return existingPlayer;
    const newPlayer = { id: `player-${Date.now()}`, name: trimmedName };
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const addGameRecord = (record: GameRecord) => {
    const updatedPlayersInRecord = record.players.map(ps => {
      let player = getPlayerById(ps.playerId);
      if (!player && ps.name) {
        const newP = addPlayer(ps.name);
        return { ...ps, playerId: newP?.id || `unknown-${Date.now()}`, name: newP?.name || ps.name };
      } else if (player && !ps.name) {
        return { ...ps, name: player.name };
      }
      return ps;
    });
    const newRecord = { ...record, players: updatedPlayersInRecord };
    checkForAchievements(newRecord);
    setGameRecords(prev => [newRecord, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    addToast({
      title: "対局記録を保存しました",
      description: `${new Date(newRecord.date).toLocaleDateString()} の対局が記録されました`,
      severity: "success",
    });
  };

  const updateGameRecord = (id: string, record: GameRecord) => {
    setGameRecords(prev => prev.map(r => r.id === id ? record : r));
    addToast({
      title: "対局記録を更新しました",
      description: `${new Date(record.date).toLocaleDateString()} の対局が更新されました`,
      severity: "success",
    });
  };

  const deleteGameRecord = (id: string) => {
    setGameRecords(prev => prev.filter(r => r.id !== id));
    if (activeSession) {
      const updatedGameRecordsInSession = activeSession.gameRecordsInSession.filter(gr => gr.id !== id);
      if (updatedGameRecordsInSession.length < activeSession.gameRecordsInSession.length) {
        setActiveSession(prevSession => prevSession ? ({
          ...prevSession,
          gameRecordsInSession: updatedGameRecordsInSession,
          currentRound: Math.max(1, prevSession.currentRound -1)
        }) : null);
      }
    }
    addToast({ title: "対局記録を削除しました", severity: "warning" });
  };

  const getDefaultSettings = (): GameSettings => ({
    startingPoints: 25000, returnPoints: 30000, uma: '10-30'
  });

  const umaSettings: UmaSettings = {
    'なし': [0, 0, 0, 0], '5-10': [10, 5, -5, -10], '10-20': [20, 10, -10, -20],
    '10-30': [30, 10, -10, -30], '20-40': [40, 20, -20, -40]
  };
  const getUmaValues = (umaType: string): number[] => umaSettings[umaType] || [0, 0, 0, 0];

  const calculateRanks = (scores: PlayerScore[]): PlayerScore[] => {
    const sortedScores = [...scores].sort((a, b) => b.rawScore - a.rawScore);
    let currentRank = 1;
    return sortedScores.map((score, index, arr) => {
      if (index > 0 && score.rawScore < arr[index - 1].rawScore) currentRank = index + 1;
      return { ...score, rank: currentRank };
    });
  };

  const calculateFinalScores = (scores: PlayerScore[], settings: GameSettings): PlayerScore[] => {
    const rankedScores = calculateRanks(scores);
    const umaValues = getUmaValues(settings.uma);
    const totalOkaBonus = ((settings.returnPoints - settings.startingPoints) * 4) / 1000;
    return rankedScores.map(score => {
      const basePoints = (score.rawScore - settings.returnPoints) / 1000;
      const umaPointsApplicable = score.rank && score.rank >= 1 && score.rank <= 4 ? umaValues[score.rank - 1] : 0;
      let finalScore = basePoints + umaPointsApplicable;
      let okaBonusAmount = 0;
      if (score.rank === 1) {
        finalScore += totalOkaBonus;
        okaBonusAmount = totalOkaBonus;
      }
      return { ...score, okaPoints: umaPointsApplicable, finalScore, okaBonus: okaBonusAmount };
    });
  };

  const checkForAchievements = (record: GameRecord) => {
    const winner = record.players.find(p => p.rank === 1);
    if (winner) {
      const playerTopGames = gameRecords.filter(r => r.players.some(p => p.playerId === winner.playerId && p.rank === 1));
      if (playerTopGames.length === 0 && !achievements.some(a => a.playerId === winner.playerId && a.title === "初トップ達成！")) {
        const newAchievement: Achievement = {
          id: `achievement-${Date.now()}-firsttop`, playerId: winner.playerId, title: "初トップ達成！",
          description: "初めての対局でトップを獲得しました", icon: "lucide:trophy", date: record.date
        };
        setAchievements(prev => [...prev, newAchievement]);
        addToast({ title: "称号獲得！", description: `${winner.name}さんが「初トップ達成！」を獲得しました`, severity: "success" });
      }
    }
    record.highlights?.forEach(highlight => {
      if (highlight.type === 'yakuman' && highlight.playerId) {
        const player = players.find(p => p.id === highlight.playerId);
        if (player && !achievements.some(a => a.playerId === highlight.playerId && a.title === "役満達成！" && a.date.startsWith(record.date.substring(0,10)))) {
          const newAchievement: Achievement = {
            id: `achievement-${Date.now()}-yakuman-${highlight.playerId}`, playerId: highlight.playerId, title: "役満達成！",
            description: highlight.text || "役満を達成しました！", icon: "lucide:sparkles", date: record.date
          };
          setAchievements(prev => [...prev, newAchievement]);
          addToast({ title: "称号獲得！", description: `${player.name}さんが「役満達成！」を獲得しました`, severity: "success" });
        }
      }
    });
  };

  const startNewSession = (sessionName: string, sessionPlayers: Player[], sessionSettings: GameSettings): GameSession | null => {
    if (activeSession) {
      addToast({ title: "エラー", description: "既に進行中の対局会があります。", severity: "danger" }); return null;
    }
    if (sessionPlayers.length !== 4) {
      addToast({ title: "エラー", description: "プレイヤーは4名選択してください。", severity: "danger" }); return null;
    }
    const ensuredPlayers = sessionPlayers.map(p => {
      if (p.id && getPlayerById(p.id)) return p;
      const existingPlayer = players.find(pl => pl.name === p.name);
      if (existingPlayer) return existingPlayer;
      return addPlayer(p.name) || { id: `error-player-${p.name}-${Date.now()}`, name: p.name };
    }).filter(p => p && p.id && !p.id.startsWith('error-player')) as Player[];

    if (ensuredPlayers.length !== 4) {
      addToast({ title: "エラー", description: "プレイヤー情報の処理に問題が発生しました。", severity: "danger" }); return null;
    }
    const newSession: GameSession = {
      id: `session-${Date.now()}`, startDate: new Date().toISOString(), players: ensuredPlayers,
      settings: sessionSettings, gameRecordsInSession: [], status: 'active', currentRound: 1,
      name: sessionName || `対局会 ${new Date().toLocaleDateString()}`,
    };
    setActiveSession(newSession);
    addToast({ title: "対局会開始", description: `「${newSession.name}」を開始しました。`, severity: "success" });
    return newSession;
  };

  const addGameToActiveSession = (rawPlayerScores: { playerId: string, name: string, rawScore: number }[]) => {
    if (!activeSession) {
      addToast({ title: "エラー", description: "アクティブな対局会がありません。", severity: "danger" }); return;
    }
    const playerScoresForCalc: PlayerScore[] = rawPlayerScores.map(rps => ({
        playerId: rps.playerId, name: rps.name, rawScore: rps.rawScore,
    }));
    const finalScores = calculateFinalScores(playerScoresForCalc, activeSession.settings);
    const gameRecord: GameRecord = {
      id: `game-${Date.now()}-s${activeSession.id}-r${activeSession.currentRound}`,
      date: new Date().toISOString(), players: finalScores, settings: activeSession.settings,
      sessionId: activeSession.id,
    };
    addGameRecord(gameRecord);
    setActiveSession(prev => prev ? ({
      ...prev, gameRecordsInSession: [...prev.gameRecordsInSession, gameRecord],
      currentRound: prev.currentRound + 1,
    }) : null);
    addToast({ title: `${activeSession.currentRound}半荘目 記録完了`, description: "次の半荘に進みます。", severity: "primary" });
  };

  const completeActiveSession = () => {
    if (!activeSession) {
      addToast({ title: "エラー", description: "アクティブな対局会がありません。", severity: "danger" }); return;
    }
    const completedSession: GameSession = { ...activeSession, status: 'completed', endDate: new Date().toISOString() };
    setGameSessions(prev => [completedSession, ...prev].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    setActiveSession(null);
    addToast({ title: "対局会終了", description: `「${completedSession.name}」を終了しました。`, severity: "success" });
  };

  const getActiveSessionSummary = (): PlayerScore[] | null => {
    if (!activeSession || activeSession.gameRecordsInSession.length === 0) return null;
    const summary: Record<string, { playerId: string, name: string, totalFinalScore: number, totalRawScore: number, gamesPlayed: number, ranks: number[] }> = {};
    activeSession.players.forEach(p => {
      summary[p.id] = { playerId: p.id, name: p.name, totalFinalScore: 0, totalRawScore: 0, gamesPlayed: 0, ranks: [] };
    });
    activeSession.gameRecordsInSession.forEach(record => {
      record.players.forEach(ps => {
        if (summary[ps.playerId]) {
          summary[ps.playerId].totalFinalScore += ps.finalScore || 0;
          summary[ps.playerId].totalRawScore += ps.rawScore;
          summary[ps.playerId].gamesPlayed += 1;
          if (ps.rank) summary[ps.playerId].ranks.push(ps.rank);
        }
      });
    });
    const summaryPlayerScores: PlayerScore[] = Object.values(summary).map(s => ({
        playerId: s.playerId, name: s.name, rawScore: s.totalRawScore, finalScore: s.totalFinalScore,
    }));
    const sortedSummary = summaryPlayerScores.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    let currentRank = 1;
    return sortedSummary.map((score, index, arr) => {
        if (index > 0 && (score.finalScore || 0) < (arr[index - 1].finalScore || 0)) currentRank = index + 1;
        return { ...score, rank: currentRank };
    });
  };

  const deleteSession = (sessionId: string) => {
    if (activeSession && activeSession.id === sessionId) setActiveSession(null);
    setGameSessions(prev => prev.filter(s => s.id !== sessionId));
    addToast({ title: "対局会削除", description: "選択された対局会を削除しました。", severity: "warning" });
  };

  const value = {
    players, gameRecords, achievements, gameSessions, activeSession, isContextLoaded,
    addPlayer, addGameRecord, updateGameRecord, deleteGameRecord, getPlayerById,
    getDefaultSettings, getUmaValues, calculateRanks, calculateFinalScores,
    startNewSession, addGameToActiveSession, completeActiveSession,
    getActiveSessionSummary, deleteSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};