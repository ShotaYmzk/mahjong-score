import React from 'react';
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Select, 
  SelectItem, 
  Divider,
  Accordion,
  AccordionItem,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea
} from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { AppContext } from '../contexts/AppContext';
import { PlayerScore, GameSettings, GameExpense, GameHighlight, GameRecord } from '../types';
import { ScoreResultCard } from './ScoreResultCard';
import { ExpenseCalculator } from './ExpenseCalculator';

export const ScoreCalculator: React.FC = () => {
  const { 
    players, 
    addPlayer, 
    addGameRecord, 
    getDefaultSettings, 
    calculateFinalScores 
  } = React.useContext(AppContext);
  
  const [playerScores, setPlayerScores] = React.useState<PlayerScore[]>([
    { playerId: '', name: '', rawScore: 25000 },
    { playerId: '', name: '', rawScore: 25000 },
    { playerId: '', name: '', rawScore: 25000 },
    { playerId: '', name: '', rawScore: 25000 }
  ]);
  
  const [settings, setSettings] = React.useState<GameSettings>(getDefaultSettings());
  const [expenses, setExpenses] = React.useState<GameExpense[]>([]);
  const [highlights, setHighlights] = React.useState<GameHighlight[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [venue, setVenue] = React.useState<string>('');
  const [calculatedScores, setCalculatedScores] = React.useState<PlayerScore[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [showExpenseCalculator, setShowExpenseCalculator] = React.useState(false);
  const [totalPointsError, setTotalPointsError] = React.useState(false);
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const highlightModal = useDisclosure();
  const [newHighlight, setNewHighlight] = React.useState<GameHighlight>({
    text: '',
    type: 'normal'
  });

  // Check if total points match expected total
  React.useEffect(() => {
    const totalPoints = playerScores.reduce((sum, player) => sum + player.rawScore, 0);
    const expectedTotal = settings.startingPoints * 4;
    setTotalPointsError(totalPoints !== expectedTotal);
  }, [playerScores, settings.startingPoints]);

  const handlePlayerNameChange = (index: number, value: string) => {
    const updatedScores = [...playerScores];
    
    // Check if player exists in saved players
    const existingPlayer = players.find(p => p.name === value);
    
    if (existingPlayer) {
      updatedScores[index] = {
        ...updatedScores[index],
        playerId: existingPlayer.id,
        name: value
      };
    } else {
      updatedScores[index] = {
        ...updatedScores[index],
        name: value,
        playerId: '' // Will be created when saving
      };
    }
    
    setPlayerScores(updatedScores);
  };

  const handleScoreChange = (index: number, value: string) => {
    const score = parseInt(value) || 0;
    const updatedScores = [...playerScores];
    updatedScores[index] = {
      ...updatedScores[index],
      rawScore: score
    };
    setPlayerScores(updatedScores);
  };

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'startingPoints' || key === 'returnPoints' ? parseInt(value) : value
    }));
  };

  const calculateScores = () => {
    // Validate player names
    const hasEmptyNames = playerScores.some(p => !p.name.trim());
    if (hasEmptyNames) {
      addToast({
        title: "エラー",
        description: "すべてのプレイヤー名を入力してください",
        severity: "danger",
      });
      return;
    }
    
    // Validate scores
    if (totalPointsError) {
      addToast({
        title: "エラー",
        description: `合計点数が${settings.startingPoints * 4}点になるように調整してください`,
        severity: "danger",
      });
      return;
    }
    
    // Calculate final scores
    const finalScores = calculateFinalScores(playerScores, settings);
    setCalculatedScores(finalScores);
    setShowResults(true);
  };

  const resetCalculator = () => {
    setPlayerScores([
      { playerId: '', name: '', rawScore: settings.startingPoints },
      { playerId: '', name: '', rawScore: settings.startingPoints },
      { playerId: '', name: '', rawScore: settings.startingPoints },
      { playerId: '', name: '', rawScore: settings.startingPoints }
    ]);
    setExpenses([]);
    setHighlights([]);
    setTags([]);
    setVenue('');
    setCalculatedScores([]);
    setShowResults(false);
    setShowExpenseCalculator(false);
  };

  const saveGameRecord = () => {
    // Create player IDs for new players
    const finalPlayerScores = calculatedScores.map(score => {
      if (!score.playerId && score.name) {
        const newPlayer = addPlayer(score.name);
        return {
          ...score,
          playerId: newPlayer?.id || ''
        };
      }
      return score;
    });
    
    const gameRecord: GameRecord = {
      id: `game-${Date.now()}`,
      date: new Date().toISOString(),
      players: finalPlayerScores,
      settings,
      expenses: expenses.length > 0 ? expenses : undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      tags: tags.length > 0 ? tags : undefined,
      venue: venue || undefined
    };
    
    addGameRecord(gameRecord);
    resetCalculator();
  };

  const handleAddHighlight = () => {
    if (newHighlight.text.trim()) {
      setHighlights(prev => [...prev, {
        ...newHighlight,
        text: newHighlight.text.trim()
      }]);
      setNewHighlight({ text: '', type: 'normal' });
      highlightModal.onClose();
    }
  };

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleExpensesUpdate = (newExpenses: GameExpense[]) => {
    setExpenses(newExpenses);
    setShowExpenseCalculator(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-content1">
          <CardBody>
            <h2 className="text-xl font-semibold mb-4">スコア計算</h2>
            
            <div className="space-y-6">
              {/* Game Settings */}
              <div>
                <h3 className="text-md font-medium mb-2">ルール設定</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    label="持ち点"
                    value={settings.startingPoints.toString()}
                    onValueChange={(value) => handleSettingChange('startingPoints', value)}
                    endContent={<span className="text-default-400">点</span>}
                  />
                  <Input
                    type="number"
                    label="返し点"
                    value={settings.returnPoints.toString()}
                    onValueChange={(value) => handleSettingChange('returnPoints', value)}
                    endContent={<span className="text-default-400">点</span>}
                  />
                  <Select
                    label="ウマ"
                    selectedKeys={[settings.uma]}
                    onChange={(e) => handleSettingChange('uma', e.target.value)}
                  >
                    <SelectItem key="なし" value="なし">なし</SelectItem>
                    <SelectItem key="5-10" value="5-10">5-10</SelectItem>
                    <SelectItem key="10-20" value="10-20">10-20</SelectItem>
                    <SelectItem key="10-30" value="10-30">10-30</SelectItem>
                    <SelectItem key="20-40" value="20-40">20-40</SelectItem>
                  </Select>
                </div>
              </div>
              
              <Divider />
              
              {/* Player Scores */}
              <div>
                <h3 className="text-md font-medium mb-2">プレイヤースコア</h3>
                <div className="space-y-4">
                  {playerScores.map((player, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={`プレイヤー ${index + 1}`}
                        placeholder="名前を入力"
                        value={player.name}
                        onValueChange={(value) => handlePlayerNameChange(index, value)}
                        list={`players-list-${index}`}
                      />
                      <datalist id={`players-list-${index}`}>
                        {players.map(p => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                      <Input
                        type="number"
                        label="素点"
                        value={player.rawScore.toString()}
                        onValueChange={(value) => handleScoreChange(index, value)}
                        endContent={<span className="text-default-400">点</span>}
                        color={totalPointsError ? "danger" : "default"}
                      />
                    </div>
                  ))}
                  
                  {totalPointsError && (
                    <p className="text-danger text-sm">
                      <Icon icon="lucide:alert-circle" className="inline-block mr-1" />
                      合計点数が{settings.startingPoints * 4}点になるように調整してください
                      （現在: {playerScores.reduce((sum, player) => sum + player.rawScore, 0)}点）
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  color="primary"
                  onPress={calculateScores}
                  startContent={<Icon icon="lucide:calculator" />}
                  isDisabled={totalPointsError}
                >
                  計算する
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ScoreResultCard 
            scores={calculatedScores} 
            settings={settings} 
          />
          
          <div className="mt-6 space-y-4">
            <Card className="bg-content1">
              <CardBody>
                <h3 className="text-lg font-medium mb-4">追加情報</h3>
                
                <Accordion>
                  <AccordionItem
                    key="1"
                    aria-label="対局メモ"
                    title="対局メモ"
                    startContent={<Icon icon="lucide:file-text" />}
                  >
                    <div className="space-y-4 py-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="font-medium">ハイライト:</p>
                        {highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-1 bg-default-100 px-2 py-1 rounded-md">
                            {highlight.type === 'yakuman' && (
                              <Icon icon="lucide:sparkles" className="text-warning" />
                            )}
                            {highlight.type === 'comeback' && (
                              <Icon icon="lucide:trending-up" className="text-success" />
                            )}
                            <span>{highlight.text}</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => setHighlights(prev => prev.filter((_, i) => i !== index))}
                            >
                              <Icon icon="lucide:x" size={14} />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={highlightModal.onOpen}
                          startContent={<Icon icon="lucide:plus" />}
                        >
                          追加
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="font-medium">タグ:</p>
                        {tags.map((tag, index) => (
                          <div key={index} className="flex items-center gap-1 bg-default-100 px-2 py-1 rounded-md">
                            <Icon icon="lucide:tag" size={14} />
                            <span>{tag}</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => handleRemoveTag(tag)}
                            >
                              <Icon icon="lucide:x" size={14} />
                            </Button>
                          </div>
                        ))}
                        <Input
                          size="sm"
                          placeholder="タグを追加"
                          className="max-w-[150px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddTag((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </div>
                      
                      <Input
                        label="対局場所"
                        placeholder="例: 〇〇雀荘"
                        value={venue}
                        onValueChange={setVenue}
                      />
                    </div>
                  </AccordionItem>
                  
                  <AccordionItem
                    key="2"
                    aria-label="精算"
                    title="精算"
                    startContent={<Icon icon="lucide:wallet" />}
                  >
                    <div className="space-y-4 py-2">
                      {expenses.length > 0 ? (
                        <div>
                          <h4 className="font-medium mb-2">経費一覧</h4>
                          <ul className="space-y-2">
                            {expenses.map((expense, index) => (
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
                          <div className="mt-4">
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => setShowExpenseCalculator(true)}
                            >
                              編集する
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-4">
                          <Icon icon="lucide:wallet" size={32} className="text-default-400 mb-2" />
                          <p className="text-default-500 mb-4">経費が登録されていません</p>
                          <Button
                            color="primary"
                            variant="flat"
                            onPress={() => setShowExpenseCalculator(true)}
                            startContent={<Icon icon="lucide:plus" />}
                          >
                            経費を追加する
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>
            
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="flat"
                onPress={resetCalculator}
                startContent={<Icon icon="lucide:refresh-cw" />}
              >
                リセット
              </Button>
              <Button
                color="primary"
                onPress={onOpen}
                startContent={<Icon icon="lucide:save" />}
              >
                対局を保存
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Save Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">対局を保存しますか？</ModalHeader>
              <ModalBody>
                <p>この対局結果をライフログに保存します。保存後はダッシュボードや対戦履歴で確認できます。</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  キャンセル
                </Button>
                <Button 
                  color="primary" 
                  onPress={() => {
                    saveGameRecord();
                    onClose();
                  }}
                >
                  保存する
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Add Highlight Modal */}
      <Modal isOpen={highlightModal.isOpen} onOpenChange={highlightModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">ハイライトを追加</ModalHeader>
              <ModalBody>
                <Textarea
                  label="ハイライト内容"
                  placeholder="例: 東3局、Aさんが劇的な四暗刻をツモ！"
                  value={newHighlight.text}
                  onValueChange={(value) => setNewHighlight(prev => ({ ...prev, text: value }))}
                />
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">タイプ</p>
                  <div className="flex flex-wrap gap-2">
                    <Checkbox
                      isSelected={newHighlight.type === 'normal'}
                      onValueChange={() => setNewHighlight(prev => ({ ...prev, type: 'normal' }))}
                    >
                      通常
                    </Checkbox>
                    <Checkbox
                      isSelected={newHighlight.type === 'yakuman'}
                      onValueChange={() => setNewHighlight(prev => ({ ...prev, type: 'yakuman' }))}
                    >
                      役満
                    </Checkbox>
                    <Checkbox
                      isSelected={newHighlight.type === 'comeback'}
                      onValueChange={() => setNewHighlight(prev => ({ ...prev, type: 'comeback' }))}
                    >
                      逆転
                    </Checkbox>
                    <Checkbox
                      isSelected={newHighlight.type === 'other'}
                      onValueChange={() => setNewHighlight(prev => ({ ...prev, type: 'other' }))}
                    >
                      その他
                    </Checkbox>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">関連プレイヤー (任意)</p>
                  <Select
                    placeholder="プレイヤーを選択"
                    onChange={(e) => setNewHighlight(prev => ({ ...prev, playerId: e.target.value }))}
                  >
                    {calculatedScores.map((player) => (
                      <SelectItem key={player.playerId || player.name} value={player.playerId || ''}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  キャンセル
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleAddHighlight}
                  isDisabled={!newHighlight.text.trim()}
                >
                  追加する
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Expense Calculator Modal */}
      {showExpenseCalculator && (
        <ExpenseCalculator
          players={calculatedScores}
          expenses={expenses}
          onClose={() => setShowExpenseCalculator(false)}
          onSave={handleExpensesUpdate}
        />
      )}
    </div>
  );
};