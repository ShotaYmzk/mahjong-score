import React from 'react';
import { Card, CardBody, Progress, Tooltip } from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { PlayerStats } from '../types';

interface StatsOverviewProps {
  stats: PlayerStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Average Rank */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-default-500">平均順位</p>
                <h3 className="text-2xl font-bold">{stats.averageRank.toFixed(2)}</h3>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Icon icon="lucide:bar-chart" className="text-primary" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                aria-label="平均順位" 
                value={(4 - stats.averageRank) / 3 * 100} 
                color="primary"
                className="mt-2"
              />
              <div className="flex justify-between mt-1 text-xs text-default-500">
                <span>1位</span>
                <span>4位</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Top Rate */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-default-500">トップ率</p>
                <h3 className="text-2xl font-bold">{(stats.firstPlaceRate * 100).toFixed(1)}%</h3>
              </div>
              <div className="p-2 rounded-full bg-warning/10">
                <Icon icon="lucide:trophy" className="text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">{stats.firstPlaceCount}回</span>
                <Progress 
                  aria-label="トップ率" 
                  value={stats.firstPlaceRate * 100} 
                  color="warning"
                  className="flex-1"
                />
                <span className="text-sm">{stats.totalGames}回</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Top Two Rate */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-default-500">連対率</p>
                <h3 className="text-2xl font-bold">{(stats.topTwoRate * 100).toFixed(1)}%</h3>
              </div>
              <div className="p-2 rounded-full bg-success/10">
                <Icon icon="lucide:trending-up" className="text-success" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">{stats.firstPlaceCount + stats.secondPlaceCount}回</span>
                <Progress 
                  aria-label="連対率" 
                  value={stats.topTwoRate * 100} 
                  color="success"
                  className="flex-1"
                />
                <span className="text-sm">{stats.totalGames}回</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Last Place Avoidance Rate */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-default-500">ラス回避率</p>
                <h3 className="text-2xl font-bold">{(stats.notLastRate * 100).toFixed(1)}%</h3>
              </div>
              <div className="p-2 rounded-full bg-danger/10">
                <Icon icon="lucide:shield" className="text-danger" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">{stats.totalGames - stats.lastPlaceCount}回</span>
                <Progress 
                  aria-label="ラス回避率" 
                  value={stats.notLastRate * 100} 
                  color="danger"
                  className="flex-1"
                />
                <span className="text-sm">{stats.totalGames}回</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Total Points */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-default-500">累計ポイント</p>
                <h3 className="text-2xl font-bold">
                  {stats.totalPoints > 0 ? '+' : ''}{stats.totalPoints.toFixed(1)}
                </h3>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Icon 
                  icon={stats.totalPoints >= 0 ? "lucide:trending-up" : "lucide:trending-down"} 
                  className={stats.totalPoints >= 0 ? "text-success" : "text-danger"} 
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-default-500">
                平均: {(stats.totalPoints / stats.totalGames).toFixed(1)} pt/回
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Rank Distribution */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-default-500">順位分布</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tooltip content="1位">
                  <div className="w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center">
                    <span className="text-xs text-warning">1</span>
                  </div>
                </Tooltip>
                <Progress 
                  aria-label="1位" 
                  value={(stats.firstPlaceCount / stats.totalGames) * 100} 
                  color="warning"
                  className="flex-1"
                />
                <span className="text-sm">{stats.firstPlaceCount}回</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="2位">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-xs text-primary">2</span>
                  </div>
                </Tooltip>
                <Progress 
                  aria-label="2位" 
                  value={(stats.secondPlaceCount / stats.totalGames) * 100} 
                  color="primary"
                  className="flex-1"
                />
                <span className="text-sm">{stats.secondPlaceCount}回</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="3位">
                  <div className="w-6 h-6 bg-default-200 rounded-full flex items-center justify-center">
                    <span className="text-xs">3</span>
                  </div>
                </Tooltip>
                <Progress 
                  aria-label="3位" 
                  value={((stats.totalGames - stats.firstPlaceCount - stats.secondPlaceCount - stats.lastPlaceCount) / stats.totalGames) * 100} 
                  color="default"
                  className="flex-1"
                />
                <span className="text-sm">{stats.totalGames - stats.firstPlaceCount - stats.secondPlaceCount - stats.lastPlaceCount}回</span>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="4位">
                  <div className="w-6 h-6 bg-danger/20 rounded-full flex items-center justify-center">
                    <span className="text-xs text-danger">4</span>
                  </div>
                </Tooltip>
                <Progress 
                  aria-label="4位" 
                  value={(stats.lastPlaceCount / stats.totalGames) * 100} 
                  color="danger"
                  className="flex-1"
                />
                <span className="text-sm">{stats.lastPlaceCount}回</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Yakuman Count */}
      <motion.div variants={item}>
        <Card className="bg-content2">
          <CardBody>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-default-500">役満達成数</p>
                <h3 className="text-2xl font-bold">{stats.yakumanCount}</h3>
              </div>
              <div className="p-2 rounded-full bg-warning/10">
                <Icon icon="lucide:sparkles" className="text-warning" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-default-500">
                {stats.yakumanCount > 0 
                  ? `平均: ${(stats.totalGames / stats.yakumanCount).toFixed(1)}回に1回の確率` 
                  : '役満達成はまだありません'}
              </p>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </motion.div>
  );
};