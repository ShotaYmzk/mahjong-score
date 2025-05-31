import React from 'react';
import { 
  Card, 
  CardBody, 
  Tabs, 
  Tab, 
  Avatar, 
  Badge, 
  Tooltip,
  Select,
  SelectItem,
  Divider
} from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { AppContext } from '../contexts/AppContext';
import { PlayerStats, HeadToHeadRecord } from '../types';
import { StatsOverview } from './StatsOverview';
import { PerformanceChart } from './PerformanceChart';
import { RivalAnalysis } from './RivalAnalysis';
import { AchievementsList } from './AchievementsList';

export const Dashboard: React.FC = () => {
  const { players, gameRecords, achievements } = React.useContext(AppContext);
  const [selectedPlayer, setSelectedPlayer] = React.useState<string>('');
  const [playerStats, setPlayerStats] = React.useState<PlayerStats | null>(null);
  const [headToHeadRecords, setHeadToHeadRecords] = React.useState<HeadToHeadRecord[]>([]);
  const [recentGames, setRecentGames] = React.useState<any[]>([]);
  
  // Calculate player stats when selected player changes
  React.useEffect(() => {
    if (!selectedPlayer || players.length === 0) {
      setPlayerStats(null);
      setHeadToHeadRecords([]);
      setRecentGames([]);
      return;
    }
    
    calculatePlayerStats(selectedPlayer);
  }, [selectedPlayer, gameRecords, players]);
  
  // Set first player as default when players load
  React.useEffect(() => {
    if (players.length > 0 && !selectedPlayer) {
      setSelectedPlayer(players[0].id);
    }
  }, [players]);
  
  const calculatePlayerStats = (playerId: string) => {
    // Get all games for this player
    const playerGames = gameRecords.filter(game => 
      game.players.some(p => p.playerId === playerId)
    );
    
    if (playerGames.length === 0) {
      setPlayerStats(null);
      return;
    }
    
    // Calculate basic stats
    let totalPoints = 0;
    let totalRank = 0;
    let firstPlaceCount = 0;
    let secondPlaceCount = 0;
    let lastPlaceCount = 0;
    
    playerGames.forEach(game => {
      const playerScore = game.players.find(p => p.playerId === playerId);
      if (playerScore) {
        totalPoints += playerScore.finalScore || 0;
        totalRank += playerScore.rank || 0;
        
        if (playerScore.rank === 1) firstPlaceCount++;
        if (playerScore.rank === 2) secondPlaceCount++;
        if (playerScore.rank === 4) lastPlaceCount++;
      }
    });
    
    // Calculate head-to-head records
    const opponents: Record<string, { wins: number, losses: number, pointsDiff: number, name: string }> = {};
    
    playerGames.forEach(game => {
      const playerScore = game.players.find(p => p.playerId === playerId);
      if (!playerScore) return;
      
      game.players.forEach(opponent => {
        if (opponent.playerId === playerId) return;
        
        if (!opponents[opponent.playerId]) {
          opponents[opponent.playerId] = {
            wins: 0,
            losses: 0,
            pointsDiff: 0,
            name: opponent.name
          };
        }
        
        // Compare ranks
        if (playerScore.rank && opponent.rank) {
          if (playerScore.rank < opponent.rank) {
            opponents[opponent.playerId].wins++;
          } else if (playerScore.rank > opponent.rank) {
            opponents[opponent.playerId].losses++;
          }
        }
        
        // Compare points
        if (playerScore.finalScore !== undefined && opponent.finalScore !== undefined) {
          opponents[opponent.playerId].pointsDiff += playerScore.finalScore - opponent.finalScore;
        }
      });
    });
    
    // Convert to array and sort by most games played
    const headToHead = Object.entries(opponents).map(([opponentId, record]) => ({
      opponentId,
      opponentName: record.name,
      wins: record.wins,
      losses: record.losses,
      pointsDifference: record.pointsDiff
    })).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
    
    // Get player achievements
    const playerAchievements = achievements.filter(a => a.playerId === playerId);
    
    // Count yakuman
    const yakumanCount = playerAchievements.filter(a => a.title === "役満達成！").length;
    
    // Get recent games (last 20)
    const recent = playerGames
      .slice(0, 20)
      .map(game => {
        const playerScore = game.players.find(p => p.playerId === playerId);
        return {
          date: game.date,
          rank: playerScore?.rank || 0,
          points: playerScore?.finalScore || 0
        };
      })
      .reverse(); // Oldest to newest for chart
    
    // Create player stats object
    const stats: PlayerStats = {
      playerId,
      name: players.find(p => p.id === playerId)?.name || '',
      totalGames: playerGames.length,
      totalPoints,
      averageRank: totalRank / playerGames.length,
      firstPlaceCount,
      secondPlaceCount,
      lastPlaceCount,
      firstPlaceRate: firstPlaceCount / playerGames.length,
      topTwoRate: (firstPlaceCount + secondPlaceCount) / playerGames.length,
      notLastRate: (playerGames.length - lastPlaceCount) / playerGames.length,
      achievements: playerAchievements,
      yakumanCount
    };
    
    setPlayerStats(stats);
    setHeadToHeadRecords(headToHead);
    setRecentGames(recent);
  };
  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-content1">
          <CardBody>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold">パーソナル・ダッシュボード</h2>
              
              <Select
                label="プレイヤーを選択"
                placeholder="プレイヤーを選択"
                selectedKeys={selectedPlayer ? [selectedPlayer] : []}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="max-w-xs"
              >
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            {!selectedPlayer || players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icon icon="lucide:user-x" size={48} className="text-default-300 mb-4" />
                <p className="text-default-500 text-center">
                  プレイヤーが選択されていないか、登録されていません。<br />
                  対局を記録してダッシュボードを活用しましょう。
                </p>
              </div>
            ) : !playerStats ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Icon icon="lucide:history" size={48} className="text-default-300 mb-4" />
                <p className="text-default-500 text-center">
                  このプレイヤーの対局記録がまだありません。<br />
                  対局を記録してダッシュボードを活用しましょう。
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Player Header */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <Avatar
                    name={playerStats.name}
                    size="lg"
                    color="primary"
                    isBordered
                    className="text-2xl"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-center md:text-left">{playerStats.name}</h3>
                    <p className="text-default-500 text-center md:text-left">
                      総対局数: {playerStats.totalGames}回
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center md:justify-end">
                    {playerStats.achievements.slice(0, 3).map((achievement, index) => (
                      <Tooltip key={index} content={achievement.title}>
                        <Badge
                          content={<Icon icon={achievement.icon} />}
                          color="primary"
                          size="lg"
                          className="achievement-badge"
                        >
                          <div className="w-8 h-8 bg-default-100 rounded-full flex items-center justify-center">
                            <span className="text-xs">{index + 1}</span>
                          </div>
                        </Badge>
                      </Tooltip>
                    ))}
                    
                    {playerStats.achievements.length > 3 && (
                      <Tooltip content={`他 ${playerStats.achievements.length - 3} 個の称号`}>
                        <Badge
                          content={`+${playerStats.achievements.length - 3}`}
                          color="default"
                          size="lg"
                        >
                          <div className="w-8 h-8 bg-default-100 rounded-full flex items-center justify-center">
                            <Icon icon="lucide:more-horizontal" />
                          </div>
                        </Badge>
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <Divider />
                
                {/* Dashboard Tabs */}
                <Tabs aria-label="ダッシュボードタブ">
                  <Tab
                    key="overview"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:pie-chart" />
                        <span>総合成績</span>
                      </div>
                    }
                  >
                    <div className="pt-4 space-y-6">
                      <StatsOverview stats={playerStats} />
                      
                      {recentGames.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">成績推移</h3>
                          <div className="h-[300px]">
                            <PerformanceChart games={recentGames} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab
                    key="rivals"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:swords" />
                        <span>ライバル分析</span>
                      </div>
                    }
                  >
                    <div className="pt-4">
                      <RivalAnalysis records={headToHeadRecords} />
                    </div>
                  </Tab>
                  
                  <Tab
                    key="achievements"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:medal" />
                        <span>称号</span>
                      </div>
                    }
                  >
                    <div className="pt-4">
                      <AchievementsList achievements={playerStats.achievements} />
                    </div>
                  </Tab>
                </Tabs>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};