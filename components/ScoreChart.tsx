import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { PlayerScore, GameSettings } from '../types';

interface ScoreChartProps {
  scores: PlayerScore[];
  settings: GameSettings;
  isSessionSummary?: boolean;
}

interface ChartData {
  name: string;
  baseAdjustment: number; // (素点 - 返し点)/1000 または 総合Pt (セッションサマリー時)
  umaPoints: number;
  okaBonus: number;
  finalScore: number; //積み上げグラフ用ではなく、ツールチップ表示用
}

export const ScoreChart: React.FC<ScoreChartProps> = ({ scores, settings, isSessionSummary = false }) => {
  const chartData: ChartData[] = scores.map(score => {
    if (isSessionSummary) {
        // セッションサマリーの場合、finalScoreが総合ポイントなので、それをbaseAdjustmentとして表示
        return {
            name: score.name,
            baseAdjustment: score.finalScore || 0, // 総合ポイント
            umaPoints: 0, // セッションサマリーではウマ・オカの内訳は表示しない
            okaBonus: 0,
            finalScore: score.finalScore || 0,
        };
    }
    // 通常の半荘結果
    const baseAdj = (score.rawScore - settings.returnPoints) / 1000;
    return {
        name: score.name,
        baseAdjustment: baseAdj,
        umaPoints: score.okaPoints || 0, // okaPointsはウマ
        okaBonus: score.okaBonus || 0,   // okaBonusはオカトップ賞
        finalScore: score.finalScore || 0,
    };
  });

  const barColors = {
    base: '#0d8de3', // 青系 (基本点)
    uma: '#36aaf6',  // 水色系 (ウマ)
    oka: '#f5a524',  // オレンジ系 (オカ)
    summary: '#0d8de3', // サマリー時の色
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartData;
      return (
        <div className="p-2 bg-background border border-default-200 rounded-md shadow-lg">
          <p className="font-bold">{label}</p>
          {!isSessionSummary && (
            <>
              <p style={{ color: barColors.base }}>素点調整: {data.baseAdjustment.toFixed(1)}</p>
              <p style={{ color: barColors.uma }}>ウマ: {data.umaPoints.toFixed(1)}</p>
              {data.okaBonus !== 0 && <p style={{ color: barColors.oka }}>オカ: {data.okaBonus.toFixed(1)}</p>}
            </>
          )}
          <p className="font-medium">最終スコア: {data.finalScore.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };
  
  const legendPayload = isSessionSummary ? [
    { value: '総合ポイント', type: 'rect' as const, color: barColors.summary }
  ] : [
    { value: '素点調整後', type: 'rect' as const, color: barColors.base },
    { value: 'ウマ', type: 'rect' as const, color: barColors.uma },
    { value: 'オカ', type: 'rect' as const, color: barColors.oka }
  ];


  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 20, // 右マージン調整
          left: -10, // 左マージン調整
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend payload={legendPayload} />
        <ReferenceLine y={0} stroke="#888" />

        {isSessionSummary ? (
            <Bar dataKey="baseAdjustment" name="総合ポイント" fill={barColors.summary} />
        ) : (
            <>
                <Bar dataKey="baseAdjustment" name="素点調整後" stackId="a" fill={barColors.base} />
                <Bar dataKey="umaPoints" name="ウマ" stackId="a" fill={barColors.uma} />
                <Bar dataKey="okaBonus" name="オカ" stackId="a" fill={barColors.oka} />
            </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
};