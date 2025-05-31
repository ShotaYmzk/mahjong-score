import React from 'react';
import { 
  Player, 
  GameRecord, 
  GameSettings, 
  PlayerScore, 
  Achievement, 
  UmaSettings,
  GameSession // 追加
} from '../types';
import { addToast } from '@heroui/react';

interface AppContextType {
  players: Player[];
  gameRecords: GameRecord[];
  achievements: Achievement[];
  gameSessions: GameSession[]; // 追加
  activeSession: GameSession | null; // 追加
  addPlayer: (name: string) => Player | undefined; // 戻り値を修正
  addGameRecord: (record: GameRecord) => void;
  updateGameRecord: (id: string, record: GameRecord) => void;
  deleteGameRecord: (id: string) => void;
  getPlayerById: (id: string) => Player | undefined;
  getDefaultSettings: () => GameSettings;
  getUmaValues: (umaType: string) => number[];
  calculateRanks: (scores: PlayerScore[]) => PlayerScore[];
  calculateFinalScores: (scores: PlayerScore[], settings: GameSettings) => PlayerScore[];
  // 連続対局機能用メソッド
  startNewSession: (sessionName: string, players: Player[], settings: GameSettings) => GameSession | null;
  addGameToActiveSession: (rawScores: { playerId: string, name: string, rawScore: number }[]) => void;
  completeActiveSession: () => void;
  getActiveSessionSummary: () => PlayerScore[] | null; // 途中経過サマリー
  deleteSession: (sessionId: string) => void; // セッション削除機能
}

export const AppContext = React.createContext<AppContextType>({
  players: [],
  gameRecords: [],
  achievements: [],
  gameSessions: [], // 追加
  activeSession: null, // 追加
  addPlayer: () => undefined,
  addGameRecord: () => {},
  updateGameRecord: () => {},
  deleteGameRecord: () => {},
  getPlayerById: () => undefined,
  getDefaultSettings: () => ({ startingPoints: 25000, returnPoints: 30000, uma: '10-30' }),
  getUmaValues: () => [0, 0, 0, 0],
  calculateRanks: (scores) => scores,
  calculateFinalScores: (scores) => scores,
  // 連続対局機能用メソッド
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
  const [players, setPlayers] = React.useState<Player[]>(() => {
    const savedPlayers = typeof window !== 'undefined' ? localStorage.getItem('mahjong-players') : null;
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [gameRecords, setGameRecords] = React.useState<GameRecord[]>(() => {
    const savedRecords = typeof window !== 'undefined' ? localStorage.getItem('mahjong-game-records') : null;
    return savedRecords ? JSON.parse(savedRecords) : [];
  });

  const [achievements, setAchievements] = React.useState<Achievement[]>(() => {
    const savedAchievements = typeof window !== 'undefined' ? localStorage.getItem('mahjong-achievements') : null;
    return savedAchievements ? JSON.parse(savedAchievements) : [];
  });

  const [gameSessions, setGameSessions] = React.useState<GameSession[]>(() => {
    const savedSessions = typeof window !== 'undefined' ? localStorage.getItem('mahjong-game-sessions') : null;
    return savedSessions ? JSON.parse(savedSessions) : [];
  });

  const [activeSession, setActiveSession] = React.useState<GameSession | null>(() => {
    const savedActiveSession = typeof window !== 'undefined' ? localStorage.getItem('mahjong-active-session') : null;
    return savedActiveSession ? JSON.parse(savedActiveSession) : null;
  });


  // Save to localStorage whenever data changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahjong-players', JSON.stringify(players));
    }
  }, [players]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahjong-game-records', JSON.stringify(gameRecords));
    }
  }, [gameRecords]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahjong-achievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahjong-game-sessions', JSON.stringify(gameSessions));
    }
  }, [gameSessions]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeSession) {
        localStorage.setItem('mahjong-active-session', JSON.stringify(activeSession));
      } else {
        localStorage.removeItem('mahjong-active-session');
      }
    }
  }, [activeSession]);


  const addPlayer = (name: string): Player | undefined => {
    if (!name.trim()) return undefined;
    
    const trimmedName = name.trim();
    const existingPlayer = players.find(p => p.name === trimmedName);
    if (existingPlayer) return existingPlayer;

    const newPlayer = {
      id: `player-${Date.now()}`,
      name: trimmedName
    };
    
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  };

  const getPlayerById = (id: string) => {
    return players.find(p => p.id === id);
  };

  const addGameRecord = (record: GameRecord) => {
    // Ensure all players in the record exist, create if not
    const updatedPlayersInRecord = record.players.map(ps => {
      let player = getPlayerById(ps.playerId);
      if (!player && ps.name) {
        const newP = addPlayer(ps.name);
        if (newP) return { ...ps, playerId: newP.id, name: newP.name };
      } else if (player && !ps.name) {
        return { ...ps, name: player.name };
      }
      return ps;
    });
  
    const newRecord = { ...record, players: updatedPlayersInRecord };

    checkForAchievements(newRecord);
    
    setGameRecords(prev => [newRecord, ...prev.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())]);
    
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
    // Also remove from any active session if it exists there
    if (activeSession) {
      const updatedGameRecordsInSession = activeSession.gameRecordsInSession.filter(gr => gr.id !== id);
      if (updatedGameRecordsInSession.length < activeSession.gameRecordsInSession.length) {
        setActiveSession(prev => prev ? ({
          ...prev,
          gameRecordsInSession: updatedGameRecordsInSession,
          currentRound: Math.max(1, prev.currentRound -1) // Adjust round if needed
        }) : null);
      }
    }
    addToast({
      title: "対局記録を削除しました",
      severity: "warning",
    });
  };

  const getDefaultSettings = (): GameSettings => {
    return {
      startingPoints: 25000,
      returnPoints: 30000,
      uma: '10-30' // 一般的な初期値
    };
  };

  const umaSettings: UmaSettings = {
    'なし': [0, 0, 0, 0],
    '5-10': [10, 5, -5, -10],
    '10-20': [20, 10, -10, -20],
    '10-30': [30, 10, -10, -30],
    '20-40': [40, 20, -20, -40]
  };

  const getUmaValues = (umaType: string): number[] => {
    return umaSettings[umaType] || [0, 0, 0, 0];
  };

  const calculateRanks = (scores: PlayerScore[]): PlayerScore[] => {
    const sortedScores = [...scores].sort((a, b) => b.rawScore - a.rawScore);
    let currentRank = 1;
    return sortedScores.map((score, index, arr) => {
      if (index > 0 && score.rawScore < arr[index - 1].rawScore) {
        currentRank = index + 1;
      }
      return {
        ...score,
        rank: currentRank
      };
    });
  };

  const calculateFinalScores = (scores: PlayerScore[], settings: GameSettings): PlayerScore[] => {
    const rankedScores = calculateRanks(scores);
    const umaValues = getUmaValues(settings.uma);
    
    const scoresWithUmaAndBaseCalc = rankedScores.map(score => {
      const basePoints = (score.rawScore - settings.returnPoints) / 1000;
      const umaPointsApplicable = score.rank && score.rank >= 1 && score.rank <= 4 ? umaValues[score.rank - 1] : 0;
      
      return {
        ...score,
        okaPoints: umaPointsApplicable, // ウマの点数
        finalScore: basePoints + umaPointsApplicable, // 仮の最終スコア (オカ適用前)
        okaBonus: 0, // オカボーナス初期化
      };
    });

    const totalOkaBonus = ((settings.returnPoints - settings.startingPoints) * 4) / 1000;

    const finalScoresWithOka = scoresWithUmaAndBaseCalc.map(score => {
      if (score.rank === 1) {
        return {
          ...score,
          finalScore: (score.finalScore || 0) + totalOkaBonus,
          okaBonus: totalOkaBonus,
        };
      }
      return score;
    });
    
    return finalScoresWithOka;
  };

  const checkForAchievements = (record: GameRecord) => {
    const winner = record.players.find(p => p.rank === 1);
    if (winner) {
      const playerGames = gameRecords.filter(r => 
        r.players.some(p => p.playerId === winner.playerId && p.rank === 1) // トップを取ったゲームのみカウント
      );
      
      if (playerGames.length === 0) { // 今回が初めてのトップなら
        const newAchievement: Achievement = {
          id: `achievement-${Date.now()}-firsttop`,
          playerId: winner.playerId,
          title: "初トップ達成！",
          description: "初めての対局でトップを獲得しました",
          icon: "lucide:trophy",
          date: record.date
        };
        if (!achievements.some(a => a.playerId === winner.playerId && a.title === "初トップ達成！")) {
          setAchievements(prev => [...prev, newAchievement]);
          addToast({
            title: "称号獲得！",
            description: `${winner.name}さんが「初トップ達成！」の称号を獲得しました`,
            severity: "success",
          });
        }
      }
    }
    
    if (record.highlights) {
      record.highlights.forEach(highlight => {
        if (highlight.type === 'yakuman' && highlight.playerId) {
          const player = players.find(p => p.id === highlight.playerId);
          if (player) {
            const newAchievement: Achievement = {
              id: `achievement-${Date.now()}-yakuman-${highlight.playerId}`,
              playerId: highlight.playerId,
              title: "役満達成！",
              description: highlight.text || "役満を達成しました！",
              icon: "lucide:sparkles",
              date: record.date
            };
            // 同じプレイヤーが同じ日に同じ役満称号を複数取らないように簡易チェック
            if (!achievements.some(a => a.playerId === highlight.playerId && a.title === "役満達成！" && a.date.startsWith(record.date.substring(0,10)))) {
              setAchievements(prev => [...prev, newAchievement]);
              addToast({
                title: "称号獲得！",
                description: `${player.name}さんが「役満達成！」の称号を獲得しました`,
                severity: "success",
              });
            }
          }
        }
      });
    }
  };

  // --- 連続対局機能メソッド ---
  const startNewSession = (sessionName: string, sessionPlayers: Player[], sessionSettings: GameSettings): GameSession | null => {
    if (activeSession) {
      addToast({ title: "エラー", description: "既に進行中の対局会があります。まず現在の対局会を終了してください。", severity: "danger" });
      return null;
    }
    if (sessionPlayers.length !== 4) {
      addToast({ title: "エラー", description: "プレイヤーは4名選択してください。", severity: "danger" });
      return null;
    }

    // プレイヤーをグローバルなplayersリストに追加/取得
    const ensuredPlayers = sessionPlayers.map(p => {
        if (p.id && getPlayerById(p.id)) return p; // 既存IDがあり、実在するならOK
        const existingPlayer = players.find(pl => pl.name === p.name);
        if (existingPlayer) return existingPlayer;
        const newPlayer = addPlayer(p.name);
        return newPlayer || p; // addPlayerがundefinedを返した場合元のpを使う（エラーケース）
    }).filter(p => p !== undefined) as Player[];


    if (ensuredPlayers.length !== 4) {
        addToast({ title: "エラー", description: "プレイヤー情報の処理中に問題が発生しました。", severity: "danger" });
        return null;
    }

    const newSession: GameSession = {
      id: `session-${Date.now()}`,
      startDate: new Date().toISOString(),
      players: ensuredPlayers,
      settings: sessionSettings,
      gameRecordsInSession: [],
      status: 'active',
      currentRound: 1,
      name: sessionName || `対局会 ${new Date().toLocaleDateString()}`,
    };
    setActiveSession(newSession);
    addToast({ title: "対局会開始", description: `「${newSession.name}」を開始しました。`, severity: "success" });
    return newSession;
  };

  const addGameToActiveSession = (rawPlayerScores: { playerId: string, name: string, rawScore: number }[]) => {
    if (!activeSession) {
      addToast({ title: "エラー", description: "アクティブな対局会がありません。", severity: "danger" });
      return;
    }

    // PlayerScore型に変換
    const playerScoresForCalc: PlayerScore[] = rawPlayerScores.map(rps => ({
        playerId: rps.playerId,
        name: rps.name,
        rawScore: rps.rawScore,
    }));

    const finalScores = calculateFinalScores(playerScoresForCalc, activeSession.settings);
    
    const gameRecord: GameRecord = {
      id: `game-${Date.now()}-s${activeSession.id}-r${activeSession.currentRound}`,
      date: new Date().toISOString(),
      players: finalScores,
      settings: activeSession.settings,
      sessionId: activeSession.id,
      // highlights, tags, venueなどは半荘ごとに入力できるようにするならUI変更が必要
    };

    addGameRecord(gameRecord); // グローバルな履歴にも追加

    setActiveSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        gameRecordsInSession: [...prev.gameRecordsInSession, gameRecord],
        currentRound: prev.currentRound + 1,
      };
    });
    addToast({ title: `${activeSession.currentRound}半荘目 記録完了`, description: "次の半荘に進みます。", severity: "primary" });
  };

  const completeActiveSession = () => {
    if (!activeSession) {
      addToast({ title: "エラー", description: "アクティブな対局会がありません。", severity: "danger" });
      return;
    }
    const completedSession: GameSession = {
      ...activeSession,
      status: 'completed',
      endDate: new Date().toISOString(),
    };
    setGameSessions(prev => [completedSession, ...prev.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())]);
    setActiveSession(null);
    addToast({ title: "対局会終了", description: `「${completedSession.name}」を終了しました。お疲れ様でした！`, severity: "success" });
  };

  const getActiveSessionSummary = (): PlayerScore[] | null => {
    if (!activeSession || activeSession.gameRecordsInSession.length === 0) {
      return null;
    }
  
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
    
    // PlayerScore[] 形式に変換し、総合順位を計算
    const summaryPlayerScores: PlayerScore[] = Object.values(summary).map(s => ({
        playerId: s.playerId,
        name: s.name,
        rawScore: s.totalRawScore, // 総合素点
        finalScore: s.totalFinalScore, // 総合最終スコア
        // rankは総合順位として再計算する
    }));

    // 総合最終スコアでソートしてランク付け
    const sortedSummary = summaryPlayerScores.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    let currentRank = 1;
    return sortedSummary.map((score, index, arr) => {
        if (index > 0 && (score.finalScore || 0) < (arr[index - 1].finalScore || 0)) {
            currentRank = index + 1;
        }
        return { ...score, rank: currentRank };
    });
  };

  const deleteSession = (sessionId: string) => {
    if (activeSession && activeSession.id === sessionId) {
        setActiveSession(null); // アクティブセッションを削除する場合はクリア
    }
    setGameSessions(prev => prev.filter(s => s.id !== sessionId));
    // 関連するGameRecordも削除する（オプション）
    // setGameRecords(prev => prev.filter(gr => gr.sessionId !== sessionId));
    addToast({ title: "対局会削除", description: "選択された対局会を削除しました。", severity: "warning" });
  };


  const value = {
    players,
    gameRecords,
    achievements,
    gameSessions,
    activeSession,
    addPlayer,
    addGameRecord,
    updateGameRecord,
    deleteGameRecord,
    getPlayerById,
    getDefaultSettings,
    getUmaValues,
    calculateRanks,
    calculateFinalScores,
    startNewSession,
    addGameToActiveSession,
    completeActiveSession,
    getActiveSessionSummary,
    deleteSession,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};