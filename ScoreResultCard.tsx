import React from 'react';
import { Card, CardBody, Button, Tooltip, addToast } from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { PlayerScore, GameSettings } from '../types';
import { ScoreChart } from './ScoreChart';

interface ScoreResultCardProps {
  scores: PlayerScore[];
  settings: GameSettings;
}

export const ScoreResultCard: React.FC<ScoreResultCardProps> = ({ scores, settings }) => {
  // Sort scores by rank
  const sortedScores = [...scores].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  
  // Generate shareable text
  const generateShareableText = () => {
    const date = new Date().toLocaleDateString();
    let text = `【麻雀対局結果】${date}\n\n`;
    
    sortedScores.forEach((score, index) => {
      text += `${score.rank}位: ${score.name} ${score.finalScore?.toFixed(1)}pt (${score.rawScore}点)\n`;
    });
    
    text += `\n持ち点: ${settings.startingPoints}点 / ウマ: ${settings.uma}`;
    
    return text;
  };
  
  const copyToClipboard = () => {
    const text = generateShareableText();
    navigator.clipboard.writeText(text);
    
    addToast({
      title: "コピーしました",
      description: "対局結果をクリップボードにコピーしました",
      severity: "success",
    });
  };

  return (
    <Card className="bg-content1">
      <CardBody>
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">対局結果</h2>
          <div className="flex gap-2">
            <Tooltip content="結果をコピー">
              <Button
                isIconOnly
                variant="flat"
                onPress={copyToClipboard}
                aria-label="結果をコピー"
              >
                <Icon icon="lucide:clipboard-copy" />
              </Button>
            </Tooltip>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Table */}
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-default-200">
                    <th className="py-2 px-2 text-left">順位</th>
                    <th className="py-2 px-2 text-left">プレイヤー</th>
                    <th className="py-2 px-2 text-right">素点</th>
                    <th className="py-2 px-2 text-right">ウマ</th>
                    <th className="py-2 px-2 text-right">オカ</th>
                    <th className="py-2 px-2 text-right font-bold">最終点</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedScores.map((score, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={index < sortedScores.length - 1 ? "border-b border-default-100" : ""}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          {score.rank === 1 ? (
                            <span className="text-warning font-bold flex items-center">
                              <Icon icon="lucide:trophy" className="mr-1" />
                              {score.rank}
                            </span>
                          ) : (
                            <span className={score.rank === 4 ? "text-danger" : ""}>{score.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium">{score.name}</td>
                      <td className="py-3 px-2 text-right">{score.rawScore.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={score.umaPoints && score.umaPoints > 0 ? "text-success" : score.umaPoints && score.umaPoints < 0 ? "text-danger" : ""}>
                          {score.umaPoints?.toFixed(1) || 0}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={score.okaPoints && score.okaPoints > 0 ? "text-success" : score.okaPoints && score.okaPoints < 0 ? "text-danger" : ""}>
                          {score.okaPoints?.toFixed(1) || 0}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right font-bold">
                        <span className={score.finalScore && score.finalScore > 0 ? "text-success" : score.finalScore && score.finalScore < 0 ? "text-danger" : ""}>
                          {score.finalScore?.toFixed(1) || 0}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-default-500">
              <p>持ち点: {settings.startingPoints.toLocaleString()}点 / 返し点: {settings.returnPoints.toLocaleString()}点 / ウマ: {settings.uma}</p>
            </div>
          </div>
          
          {/* Score Chart */}
          <div className="h-[300px]">
            <ScoreChart scores={sortedScores} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};