import React from 'react';
import { 
  Player, 
  GameRecord, 
  GameSettings, 
  PlayerScore, 
  Achievement, 
  UmaSettings 
} from '../types';
import { addToast } from '@heroui/react';

interface AppContextType {
  players: Player[];
  gameRecords: GameRecord[];
  achievements: Achievement[];
  addPlayer: (name: string) => void;
  addGameRecord: (record: GameRecord) => void;
  updateGameRecord: (id: string, record: GameRecord) => void;
  deleteGameRecord: (id: string) => void;
  getPlayerById: (id: string) => Player | undefined;
  getDefaultSettings: () => GameSettings;
  getUmaValues: (umaType: string) => number[];
  calculateRanks: (scores: PlayerScore[]) => PlayerScore[];
  calculateFinalScores: (scores: PlayerScore[], settings: GameSettings) => PlayerScore[];
}

export const AppContext = React.createContext<AppContextType>({
  players: [],
  gameRecords: [],
  achievements: [],
  addPlayer: () => {},
  addGameRecord: () => {},
  updateGameRecord: () => {},
  deleteGameRecord: () => {},
  getPlayerById: () => undefined,
  getDefaultSettings: () => ({ startingPoints: 25000, returnPoints: 30000, uma: '10-30' }),
  getUmaValues: () => [0, 0, 0, 0],
  calculateRanks: (scores) => scores,
  calculateFinalScores: (scores) => scores,
});

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [players, setPlayers] = React.useState<Player[]>(() => {
    const savedPlayers = localStorage.getItem('mahjong-players');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  const [gameRecords, setGameRecords] = React.useState<GameRecord[]>(() => {
    const savedRecords = localStorage.getItem('mahjong-game-records');
    return savedRecords ? JSON.parse(savedRecords) : [];
  });

  const [achievements, setAchievements] = React.useState<Achievement[]>(() => {
    const savedAchievements = localStorage.getItem('mahjong-achievements');
    return savedAchievements ? JSON.parse(savedAchievements) : [];
  });

  // Save to localStorage whenever data changes
  React.useEffect(() => {
    localStorage.setItem('mahjong-players', JSON.stringify(players));
  }, [players]);

  React.useEffect(() => {
    localStorage.setItem('mahjong-game-records', JSON.stringify(gameRecords));
  }, [gameRecords]);

  React.useEffect(() => {
    localStorage.setItem('mahjong-achievements', JSON.stringify(achievements));
  }, [achievements]);

  const addPlayer = (name: string) => {
    if (!name.trim()) return;
    
    // Check if player already exists
    const existingPlayer = players.find(p => p.name === name.trim());
    if (existingPlayer) return existingPlayer;

    const newPlayer = {
      id: `player-${Date.now()}`,
      name: name.trim()
    };
    
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  };

  const getPlayerById = (id: string) => {
    return players.find(p => p.id === id);
  };

  const addGameRecord = (record: GameRecord) => {
    // Add new players if they don't exist
    record.players.forEach(playerScore => {
      if (!players.some(p => p.id === playerScore.playerId)) {
        addPlayer(playerScore.name);
      }
    });

    // Check for achievements
    checkForAchievements(record);
    
    setGameRecords(prev => [record, ...prev]);
    
    addToast({
      title: "対局記録を保存しました",
      description: `${new Date(record.date).toLocaleDateString()} の対局が記録されました`,
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
    
    addToast({
      title: "対局記録を削除しました",
      severity: "warning",
    });
  };

  const getDefaultSettings = (): GameSettings => {
    return {
      startingPoints: 25000,
      returnPoints: 30000,
      uma: '10-30'
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
    // Sort by raw score in descending order
    const sortedScores = [...scores].sort((a, b) => b.rawScore - a.rawScore);
    
    // Assign ranks (handling ties)
    let currentRank = 1;
    let previousScore = sortedScores[0]?.rawScore;
    
    return sortedScores.map((score, index) => {
      if (index > 0 && score.rawScore < previousScore) {
        currentRank = index + 1;
      }
      previousScore = score.rawScore;
      
      return {
        ...score,
        rank: currentRank
      };
    });
  };

  const calculateFinalScores = (scores: PlayerScore[], settings: GameSettings): PlayerScore[] => {
    const rankedScores = calculateRanks(scores);
    const umaValues = getUmaValues(settings.uma);
    
    return rankedScores.map(score => {
      // Calculate oka points (return points adjustment)
      const okaPoints = (score.rawScore - settings.returnPoints) / 1000;
      
      // Get uma points based on rank
      const umaPoints = score.rank && score.rank <= 4 ? umaValues[score.rank - 1] : 0;
      
      // Calculate final score
      const finalScore = okaPoints + umaPoints;
      
      return {
        ...score,
        okaPoints,
        umaPoints,
        finalScore
      };
    });
  };

  const checkForAchievements = (record: GameRecord) => {
    // Check for first place achievement
    const winner = record.players.find(p => p.rank === 1);
    if (winner) {
      const playerGames = gameRecords.filter(r => 
        r.players.some(p => p.playerId === winner.playerId)
      );
      
      // First game ever and got first place
      if (playerGames.length === 0) {
        const newAchievement: Achievement = {
          id: `achievement-${Date.now()}`,
          playerId: winner.playerId,
          title: "初トップ達成！",
          description: "初めての対局でトップを獲得しました",
          icon: "lucide:trophy",
          date: record.date
        };
        
        setAchievements(prev => [...prev, newAchievement]);
        
        addToast({
          title: "称号獲得！",
          description: `${winner.name}さんが「初トップ達成！」の称号を獲得しました`,
          severity: "success",
        });
      }
    }
    
    // Check for yakuman achievements
    if (record.highlights) {
      record.highlights.forEach(highlight => {
        if (highlight.type === 'yakuman' && highlight.playerId) {
          const player = players.find(p => p.id === highlight.playerId);
          if (player) {
            const newAchievement: Achievement = {
              id: `achievement-${Date.now()}-${Math.random()}`,
              playerId: highlight.playerId,
              title: "役満達成！",
              description: highlight.text,
              icon: "lucide:sparkles",
              date: record.date
            };
            
            setAchievements(prev => [...prev, newAchievement]);
            
            addToast({
              title: "称号獲得！",
              description: `${player.name}さんが「役満達成！」の称号を獲得しました`,
              severity: "success",
            });
          }
        }
      });
    }
  };

  const value = {
    players,
    gameRecords,
    achievements,
    addPlayer,
    addGameRecord,
    updateGameRecord,
    deleteGameRecord,
    getPlayerById,
    getDefaultSettings,
    getUmaValues,
    calculateRanks,
    calculateFinalScores
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
