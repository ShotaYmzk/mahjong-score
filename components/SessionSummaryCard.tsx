import React from 'react';
import { Card, CardBody, Avatar, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { PlayerScore, GameSession } from '../types'; // GameSession をインポート
import { AppContext } from '../contexts/AppContext';

interface SessionSummaryCardProps {
  // activeSession を直接渡すか、計算済みのサマリーを渡すか検討
  // ここでは activeSession を渡して、内部でサマリーを取得・表示する
  session: GameSession; 
}

export const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({ session }) => {
  const { getActiveSessionSummary } = React.useContext(AppContext);
  const [summaryScores, setSummaryScores] = React.useState<PlayerScore[] | null>(null);

  React.useEffect(() => {
    setSummaryScores(getActiveSessionSummary());
  }, [session, getActiveSessionSummary]); // sessionの変更（特にgameRecordsInSession）を監視

  if (!summaryScores || summaryScores.length === 0) {
    return (
      <Card className="bg-content1">
        <CardBody className="text-center text-default-500 py-8">
          <Icon icon="lucide:loader-2" className="animate-spin text-2xl mx-auto mb-2" />
          最初の半荘の結果を記録すると、ここに途中経過が表示されます。
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-content1">
      <CardBody>
        <h3 className="text-lg font-semibold mb-4">
          {session.name} - 途中経過 ({session.currentRound -1} 半荘終了時点)
        </h3>
        <div className="space-y-3">
          {summaryScores.map((score, index) => (
            <div
              key={score.playerId}
              className="flex items-center justify-between p-3 bg-content2 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className={`font-bold text-lg w-6 text-center ${
                    score.rank === 1 ? 'text-warning' : score.rank === 4 ? 'text-danger' : ''
                }`}>
                  {score.rank}位
                </span>
                <Avatar name={score.name.charAt(0).toUpperCase()} size="sm" />
                <span className="font-medium">{score.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`font-bold text-lg ${
                    (score.finalScore || 0) > 0 ? 'text-success' : (score.finalScore || 0) < 0 ? 'text-danger' : ''
                }`}>
                  {(score.finalScore || 0).toFixed(1)} Pt
                </span>
                <span className="text-xs text-default-500">
                  (素点合計: {score.rawScore.toLocaleString()})
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-default-400 mt-4 text-right">
            持ち点: {session.settings.startingPoints}, 返し点: {session.settings.returnPoints}, ウマ: {session.settings.uma}
        </p>
      </CardBody>
    </Card>
  );
};