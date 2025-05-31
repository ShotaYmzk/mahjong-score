import React from 'react';
import { Card, CardBody, Button, Tooltip, addToast } from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { PlayerScore, GameSettings } from '../types';
import { ScoreChart } from './ScoreChart'; // ScoreChart に settings を渡すように変更

interface ScoreResultCardProps {
  scores: PlayerScore[];
  settings: GameSettings;
  isSessionSummary?: boolean; // 対局会サマリーかどうか
  sessionName?: string; // 対局会名
}

export const ScoreResultCard: React.FC<ScoreResultCardProps> = ({ scores, settings, isSessionSummary = false, sessionName }) => {
  const sortedScores = [...scores].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  
  const generateShareableText = () => {
    const date = new Date().toLocaleDateString();
    let text = isSessionSummary 
        ? `【麻雀対局会結果】${sessionName || date}\n`
        : `【麻雀対局結果】${date}\n`;
    
    text += `\nルール: ${settings.startingPoints}点持ち / ${settings.returnPoints}点返し / ウマ: ${settings.uma}\n\n`;

    sortedScores.forEach((score) => {
      text += `${score.rank}位: ${score.name} ${score.finalScore?.toFixed(1)}pt`;
      if (!isSessionSummary) { // 半荘ごとの結果なら素点も表示
        text += ` (${score.rawScore}点)`;
      }
      text += `\n`;
    });
        
    return text;
  };
  
  const copyToClipboard = () => {
    const text = generateShareableText();
    navigator.clipboard.writeText(text);
    
    addToast({
      title: "コピーしました",
      description: "結果をクリップボードにコピーしました",
      severity: "success",
    });
  };

  return (
    <Card className="bg-content1">
      <CardBody>
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isSessionSummary ? `${sessionName || ""} の総合結果` : "対局結果"}
          </h2>
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
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b border-default-200">
                    <th className="py-2 px-2 text-left">順位</th>
                    <th className="py-2 px-2 text-left">プレイヤー</th>
                    {!isSessionSummary && <th className="py-2 px-2 text-right">素点</th>}
                    {!isSessionSummary && <th className="py-2 px-2 text-right">ウマ</th>}
                    {!isSessionSummary && <th className="py-2 px-2 text-right">オカ</th>}
                    <th className="py-2 px-2 text-right font-bold">
                      {isSessionSummary ? "総合Pt" : "最終点"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedScores.map((score, index) => (
                    <motion.tr 
                      key={score.playerId || index}
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
                      {!isSessionSummary && <td className="py-3 px-2 text-right">{score.rawScore.toLocaleString()}</td>}
                      {!isSessionSummary && (
                        <td className="py-3 px-2 text-right">
                          <span className={score.okaPoints && score.okaPoints > 0 ? "text-success" : score.okaPoints && score.okaPoints < 0 ? "text-danger" : ""}>
                            {score.okaPoints?.toFixed(1) || "0.0"} {/* ウマ */}
                          </span>
                        </td>
                      )}
                      {!isSessionSummary && (
                        <td className="py-3 px-2 text-right">
                          <span className={score.okaBonus && score.okaBonus > 0 ? "text-success" : ""}>
                            {score.okaBonus && score.okaBonus > 0 ? score.okaBonus.toFixed(1) : "-"} {/* オカ (トップ賞) */}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-2 text-right font-bold">
                        <span className={score.finalScore && score.finalScore > 0 ? "text-success" : score.finalScore && score.finalScore < 0 ? "text-danger" : ""}>
                          {score.finalScore?.toFixed(1) || "0.0"}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!isSessionSummary && (
              <div className="mt-4 text-sm text-default-500">
                <p>持ち点: {settings.startingPoints.toLocaleString()}点 / 返し点: {settings.returnPoints.toLocaleString()}点 / ウマ: {settings.uma}</p>
              </div>
            )}
          </div>
          
          <div className="h-[300px]">
            <ScoreChart scores={sortedScores} settings={settings} isSessionSummary={isSessionSummary} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};