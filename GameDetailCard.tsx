import React from 'react';
import { Card, CardBody, Chip, Button, Tooltip, addToast } from "@heroui/react";
import { Icon } from '@iconify/react';
import { GameRecord } from '../types';
import { ScoreChart } from './ScoreChart';

interface GameDetailCardProps {
  record: GameRecord;
}

export const GameDetailCard: React.FC<GameDetailCardProps> = ({ record }) => {
  // Sort players by rank
  const sortedPlayers = [...record.players].sort((a, b) => (a.rank || 0) - (b.rank || 0));
  
  // Generate shareable text
  const generateShareableText = () => {
    const date = new Date(record.date).toLocaleDateString();
    let text = `【麻雀対局結果】${date}\n\n`;
    
    if (record.venue) {
      text += `場所: ${record.venue}\n`;
    }
    
    sortedPlayers.forEach((player) => {
      text += `${player.rank}位: ${player.name} ${player.finalScore?.toFixed(1)}pt (${player.rawScore}点)\n`;
    });
    
    if (record.highlights && record.highlights.length > 0) {
      text += `\n【ハイライト】\n`;
      record.highlights.forEach((highlight) => {
        text += `・${highlight.text}\n`;
      });
    }
    
    if (record.tags && record.tags.length > 0) {
      text += `\n【タグ】${record.tags.join(', ')}\n`;
    }
    
    text += `\n持ち点: ${record.settings.startingPoints}点 / ウマ: ${record.settings.uma}`;
    
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">
            {new Date(record.date).toLocaleDateString()} の対局
          </h3>
          {record.venue && (
            <p className="text-default-500">
              <Icon icon="lucide:map-pin" className="inline-block mr-1" />
              {record.venue}
            </p>
          )}
        </div>
        
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
      
      {/* Tags */}
      {record.tags && record.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {record.tags.map((tag, i) => (
            <Chip key={i} variant="flat">
              <Icon icon="lucide:tag" size={14} className="mr-1" />
              {tag}
            </Chip>
          ))}
        </div>
      )}
      
      {/* Score Table */}
      <Card className="bg-content2">
        <CardBody>
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
                {sortedPlayers.map((player, index) => (
                  <tr 
                    key={index}
                    className={index < sortedPlayers.length - 1 ? "border-b border-default-100" : ""}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        {player.rank === 1 ? (
                          <span className="text-warning font-bold flex items-center">
                            <Icon icon="lucide:trophy" className="mr-1" />
                            {player.rank}
                          </span>
                        ) : (
                          <span className={player.rank === 4 ? "text-danger" : ""}>{player.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium">{player.name}</td>
                    <td className="py-3 px-2 text-right">{player.rawScore.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={player.umaPoints && player.umaPoints > 0 ? "text-success" : player.umaPoints && player.umaPoints < 0 ? "text-danger" : ""}>
                        {player.umaPoints?.toFixed(1) || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={player.okaPoints && player.okaPoints > 0 ? "text-success" : player.okaPoints && player.okaPoints < 0 ? "text-danger" : ""}>
                        {player.okaPoints?.toFixed(1) || 0}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold">
                      <span className={player.finalScore && player.finalScore > 0 ? "text-success" : player.finalScore && player.finalScore < 0 ? "text-danger" : ""}>
                        {player.finalScore?.toFixed(1) || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-default-500">
            <p>持ち点: {record.settings.startingPoints.toLocaleString()}点 / 返し点: {record.settings.returnPoints.toLocaleString()}点 / ウマ: {record.settings.uma}</p>
          </div>
        </CardBody>
      </Card>
      
      {/* Score Chart */}
      <div className="h-[300px]">
        <ScoreChart scores={sortedPlayers} />
      </div>
      
      {/* Highlights */}
      {record.highlights && record.highlights.length > 0 && (
        <Card className="bg-content2">
          <CardBody>
            <h4 className="text-md font-medium mb-3">ハイライト</h4>
            <ul className="space-y-2">
              {record.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2">
                  {highlight.type === 'yakuman' && (
                    <Icon icon="lucide:sparkles" className="text-warning mt-1" />
                  )}
                  {highlight.type === 'comeback' && (
                    <Icon icon="lucide:trending-up" className="text-success mt-1" />
                  )}
                  {highlight.type === 'normal' && (
                    <Icon icon="lucide:bookmark" className="text-primary mt-1" />
                  )}
                  {highlight.type === 'other' && (
                    <Icon icon="lucide:info" className="text-default-500 mt-1" />
                  )}
                  <span>{highlight.text}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
      
      {/* Expenses */}
      {record.expenses && record.expenses.length > 0 && (
        <Card className="bg-content2">
          <CardBody>
            <h4 className="text-md font-medium mb-3">精算情報</h4>
            <div className="space-y-3">
              <h5 className="text-sm font-medium">経費</h5>
              <ul className="space-y-2">
                {record.expenses.map((expense, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{expense.type}</span>
                    <div className="flex items-center gap-2">
                      <span>{expense.amount.toLocaleString()}円</span>
                      <span className="text-sm text-default-500">
                        ({expense.paymentMethod === 'split' ? '割り勘' : 
                          expense.paymentMethod === 'winner' ? 'トップ払い' : 'ラス払い'})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};