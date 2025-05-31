import React from 'react';
import { Card, CardBody, Progress, Tooltip } from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { HeadToHeadRecord } from '../types';

interface RivalAnalysisProps {
  records: HeadToHeadRecord[];
}

export const RivalAnalysis: React.FC<RivalAnalysisProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Icon icon="lucide:users" width={48} height={48} className="text-default-300 mb-4" /> {/* size を width/height に変更 */}
        <p className="text-default-500 text-center">
          他のプレイヤーとの対戦記録がまだありません。<br />
          複数回の対局を記録して相性を分析しましょう。
        </p>
      </div>
    );
  }
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <motion.div 
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <h3 className="text-lg font-medium">ライバル分析</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((record, index) => {
          const totalGames = record.wins + record.losses;
          const winRate = totalGames > 0 ? record.wins / totalGames : 0;
          
          return (
            <motion.div key={record.opponentId} variants={item}>
              <Card className="bg-content2">
                <CardBody>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-md font-medium">{record.opponentName}</h4>
                    <div className="flex items-center gap-1">
                      <span className={record.pointsDifference > 0 ? "text-success" : record.pointsDifference < 0 ? "text-danger" : ""}>
                        {record.pointsDifference > 0 ? "+" : ""}{record.pointsDifference.toFixed(1)}pt
                      </span>
                      <Tooltip content="ポイント収支">
                        <Icon 
                          icon={record.pointsDifference >= 0 ? "lucide:trending-up" : "lucide:trending-down"} 
                          className={record.pointsDifference >= 0 ? "text-success" : "text-danger"} 
                          width={16} height={16} // size を width/height に変更
                        />
                      </Tooltip>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>勝敗</span>
                        <span>{record.wins}勝{record.losses}敗</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-success" 
                          style={{ width: `${winRate * 100}%` }}
                        />
                        <div 
                          className="bg-danger" 
                          style={{ width: `${(1 - winRate) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>勝率</span>
                      <span>{(winRate * 100).toFixed(1)}%</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>対戦数</span>
                      <span>{totalGames}回</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};