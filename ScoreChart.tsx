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
  Cell
} from 'recharts';
import { PlayerScore } from '../types';

interface ScoreChartProps {
  scores: PlayerScore[];
}

interface ChartData {
  name: string;
  rawScore: number;
  umaPoints: number;
  okaPoints: number;
  finalScore: number;
}

export const ScoreChart: React.FC<ScoreChartProps> = ({ scores }) => {
  const chartData: ChartData[] = scores.map(score => ({
    name: score.name,
    rawScore: score.rawScore / 1000, // Convert to K points
    umaPoints: score.umaPoints || 0,
    okaPoints: score.okaPoints || 0,
    finalScore: score.finalScore || 0
  }));

  const colors = ['#0d8de3', '#36aaf6', '#7cc8fb', '#bae0fd'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'rawScore') {
              return [`${value.toFixed(1)}K`, '素点'];
            }
            return [value.toFixed(1), name === 'umaPoints' ? 'ウマ' : name === 'okaPoints' ? 'オカ' : '最終点'];
          }}
          labelFormatter={(name) => `${name}`}
        />
        <Legend 
          payload={[
            { value: '素点', type: 'square', color: '#0d8de3' },
            { value: 'ウマ', type: 'square', color: '#36aaf6' },
            { value: 'オカ', type: 'square', color: '#7cc8fb' }
          ]}
        />
        <Bar dataKey="rawScore" name="素点" stackId="a">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[0]} />
          ))}
        </Bar>
        <Bar dataKey="umaPoints" name="ウマ" stackId="a">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[1]} />
          ))}
        </Bar>
        <Bar dataKey="okaPoints" name="オカ" stackId="a">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[2]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};