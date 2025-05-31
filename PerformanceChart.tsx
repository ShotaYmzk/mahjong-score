import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface PerformanceChartProps {
  games: {
    date: string;
    rank: number;
    points: number;
  }[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ games }) => {
  const [chartType, setChartType] = React.useState<'rank' | 'points'>('rank');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Prepare data for chart
  const chartData = games.map((game, index) => ({
    name: formatDate(game.date),
    rank: game.rank,
    points: game.points,
    gameNumber: index + 1
  }));
  
  return (
    <div className="h-full">
      <div className="flex gap-4 mb-4">
        <button
          className={`px-3 py-1 rounded-md text-sm ${chartType === 'rank' ? 'bg-primary text-white' : 'bg-default-100'}`}
          onClick={() => setChartType('rank')}
        >
          順位推移
        </button>
        <button
          className={`px-3 py-1 rounded-md text-sm ${chartType === 'points' ? 'bg-primary text-white' : 'bg-default-100'}`}
          onClick={() => setChartType('points')}
        >
          ポイント推移
        </button>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="gameNumber" 
            label={{ value: '対局数', position: 'insideBottomRight', offset: -5 }}
          />
          <YAxis 
            domain={chartType === 'rank' ? [4, 1] : ['auto', 'auto']}
            label={{ 
              value: chartType === 'rank' ? '順位' : 'ポイント', 
              angle: -90, 
              position: 'insideLeft' 
            }}
          />
          <Tooltip 
            formatter={(value: number) => [
              chartType === 'rank' ? `${value}位` : `${value.toFixed(1)}pt`,
              chartType === 'rank' ? '順位' : 'ポイント'
            ]}
            labelFormatter={(label) => `対局 ${label}`}
          />
          {chartType === 'rank' && (
            <>
              <ReferenceLine y={2.5} stroke="#888" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="rank"
                stroke="#0d8de3"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </>
          )}
          {chartType === 'points' && (
            <>
              <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#0d8de3"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};