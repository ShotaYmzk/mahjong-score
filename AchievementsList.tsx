import React from 'react';
import { Card, CardBody, Tooltip } from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Achievement } from '../types';

interface AchievementsListProps {
  achievements: Achievement[];
}

export const AchievementsList: React.FC<AchievementsListProps> = ({ achievements }) => {
  if (achievements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Icon icon="lucide:medal" size={48} className="text-default-300 mb-4" />
        <p className="text-default-500 text-center">
          まだ称号を獲得していません。<br />
          対局を重ねて称号を獲得しましょう。
        </p>
      </div>
    );
  }
  
  // Sort achievements by date (newest first)
  const sortedAchievements = [...achievements].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">獲得称号一覧</h3>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {sortedAchievements.map((achievement, index) => (
          <motion.div key={achievement.id} variants={item}>
            <Card className="bg-content2">
              <CardBody className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon icon={achievement.icon} className="text-primary" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.title}</h4>
                  <p className="text-sm text-default-500">{achievement.description}</p>
                  <p className="text-xs text-default-400 mt-1">
                    {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};