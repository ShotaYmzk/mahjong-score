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
  Textarea,
  Chip,
  Avatar,
  addToast
} from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { AppContext } from '../contexts/AppContext';
import { Player, PlayerScore, GameSettings, GameExpense, GameHighlight, GameRecord } from '../types';
import { ScoreResultCard } from '../components/ScoreResultCard';
import { ExpenseCalculator } from '../components/ExpenseCalculator';
import { SessionSetup } from '../components/SessionSetup';
import { SessionSummaryCard } from '../components/SessionSummaryCard';

export const ScoreCalculator: React.FC = () => {
  const { 
    players: globalPlayers,
    addPlayer, 
    addGameRecord,
    getDefaultSettings, 
    calculateFinalScores,
    activeSession,
    startNewSession,
    addGameToActiveSession,
    completeActiveSession,
    getActiveSessionSummary
  } = React.useContext(AppContext);
  
  const [singleGamePlayerScores, setSingleGamePlayerScores] = React.useState<PlayerScore[]>([
    { playerId: '', name: '', rawScore: 25000 },
    { playerId: '', name: '', rawScore: 25000 },
    { playerId: '', name: '', rawScore: 25000 },
    { playerId: '', name: '', rawScore: 25000 }
  ]);
  const [singleGameSettings, setSingleGameSettings] = React.useState<GameSettings>(getDefaultSettings());
  const [singleGameCalculatedScores, setSingleGameCalculatedScores] = React.useState<PlayerScore[]>([]);
  const [showSingleGameResults, setShowSingleGameResults] = React.useState(false);
  const [expenses, setExpenses] = React.useState<GameExpense[]>([]);
  const [highlights, setHighlights] = React.useState<GameHighlight[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [venue, setVenue] = React.useState<string>('');
  
  const [sessionRoundScores, setSessionRoundScores] = React.useState<number[]>(Array(4).fill(getDefaultSettings().startingPoints));
  const [sessionTotalPointsError, setSessionTotalPointsError] = React.useState(false);
  const [showSessionFinalResults, setShowSessionFinalResults] = React.useState(false);

  const saveConfirmModal = useDisclosure();
  const highlightModal = useDisclosure();
  const [newHighlight, setNewHighlight] = React.useState<GameHighlight>({ text: '', type: 'normal' });
  const expenseModal = useDisclosure();
  const sessionSetupModal = useDisclosure();

  const handleSinglePlayerNameChange = (index: number, value: string) => {
    const updatedScores = [...singleGamePlayerScores];
    const existingPlayer = globalPlayers.find(p => p.name === value);
    updatedScores[index] = {
      ...updatedScores[index],
      playerId: existingPlayer?.id || '',
      name: value
    };
    setSingleGamePlayerScores(updatedScores);
  };

  const handleSingleScoreChange = (index: number, value: string) => {
    const score = parseInt(value) || 0;
    const updatedScores = [...singleGamePlayerScores];
    updatedScores[index] = { ...updatedScores[index], rawScore: score };
    setSingleGamePlayerScores(updatedScores);
  };
  
  const [singleGameTotalPointsError, setSingleGameTotalPointsError] = React.useState(false);
  React.useEffect(() => {
    const totalPoints = singleGamePlayerScores.reduce((sum, player) => sum + player.rawScore, 0);
    const expectedTotal = singleGameSettings.startingPoints * 4;
    setSingleGameTotalPointsError(totalPoints !== expectedTotal);
  }, [singleGamePlayerScores, singleGameSettings.startingPoints]);

  const calculateSingleGameScores = () => {
    if (singleGamePlayerScores.some(p => !p.name.trim())) {
      addToast({ title: "エラー", description: "すべてのプレイヤー名を入力してください", severity: "danger" });
      return;
    }
    if (singleGameTotalPointsError) {
        addToast({ title: "エラー", description: `合計点数が${singleGameSettings.startingPoints * 4}点になるように調整してください`, severity: "danger"});
        return;
    }
    const finalScores = calculateFinalScores(singleGamePlayerScores, singleGameSettings);
    setSingleGameCalculatedScores(finalScores);
    setShowSingleGameResults(true);
  };

  const saveSingleGameRecord = () => {
    const finalPlayerScores = singleGameCalculatedScores.map(score => {
      let ensuredPlayerId = score.playerId;
      let ensuredPlayerName = score.name;
      if (!ensuredPlayerId && score.name) {
        const newP = addPlayer(score.name);
        ensuredPlayerId = newP?.id || '';
      } else if (ensuredPlayerId && !score.name) {
        const existingP = globalPlayers.find(p => p.id === ensuredPlayerId);
        ensuredPlayerName = existingP?.name || '';
      }
      return { ...score, playerId: ensuredPlayerId, name: ensuredPlayerName };
    });

    const gameRecord: GameRecord = {
      id: `game-${Date.now()}`,
      date: new Date().toISOString(),
      players: finalPlayerScores,
      settings: singleGameSettings,
      expenses: expenses.length > 0 ? expenses : undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      tags: tags.length > 0 ? tags : undefined,
      venue: venue || undefined
    };
    addGameRecord(gameRecord);
    resetSingleGameCalculator();
    saveConfirmModal.onClose();
  };
  
  const resetSingleGameCalculator = () => {
    setSingleGamePlayerScores(Array(4).fill({ playerId: '', name: '', rawScore: singleGameSettings.startingPoints }));
    setExpenses([]); setHighlights([]); setTags([]); setVenue('');
    setSingleGameCalculatedScores([]); setShowSingleGameResults(false);
  };

  React.useEffect(() => {
    if (activeSession) {
      const currentStartingPoints = activeSession.settings.startingPoints;
      const totalPoints = sessionRoundScores.reduce((sum, score) => sum + score, 0);
      const expectedTotal = currentStartingPoints * 4;
      setSessionTotalPointsError(totalPoints !== expectedTotal);
      
      // activeSessionが変更された場合（新しいセッション開始時など）にスコアを初期化
      // ただし、sessionRoundScoresが既に現在のセッションの開始点と同じ場合は再初期化しない
      const isAlreadyInitializedForCurrentSession = sessionRoundScores.every(score => score === currentStartingPoints) && sessionRoundScores.length === 4;
      if (!isAlreadyInitializedForCurrentSession) {
          setSessionRoundScores(Array(4).fill(currentStartingPoints));
      }
    }
  }, [activeSession, sessionRoundScores]); // sessionRoundScoresも依存配列に追加

  const handleSessionScoreChange = (index: number, value: string) => {
    const score = parseInt(value) || 0;
    const updatedScores = [...sessionRoundScores];
    updatedScores[index] = score;
    setSessionRoundScores(updatedScores);
  };

  const handleRecordAndNextRound = () => {
    if (!activeSession) return;
    if (sessionTotalPointsError) {
      addToast({ title: "エラー", description: `合計点数が${activeSession.settings.startingPoints * 4}点になるように調整してください`, severity: "danger"});
      return;
    }
    const rawScoresForSession = activeSession.players.map((player, index) => ({
      playerId: player.id,
      name: player.name,
      rawScore: sessionRoundScores[index]
    }));
    addGameToActiveSession(rawScoresForSession);
    // スコア入力欄はuseEffectでactiveSession.settings.startingPointsに基づいてリセットされる
  };

  const handleCompleteSessionFlow = () => {
    completeActiveSession();
    setShowSessionFinalResults(true);
  };
  
  const handleStartNewSession = (name: string, players: Player[], settings: GameSettings) => {
    startNewSession(name, players, settings);
    setShowSessionFinalResults(false);
  };

  const handleAddHighlight = () => {
    if (newHighlight.text.trim()) {
      setHighlights(prev => [...prev, { ...newHighlight, text: newHighlight.text.trim() }]);
      setNewHighlight({ text: '', type: 'normal' });
      highlightModal.onClose();
    }
  };
  const handleAddTag = (tag: string) => { if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]); };
  const handleRemoveTag = (tag: string) => { setTags(prev => prev.filter(t => t !== tag)); };
  const handleExpensesUpdate = (newExpenses: GameExpense[]) => {
    setExpenses(newExpenses);
    expenseModal.onClose();
  };

  if (activeSession) {
    if (showSessionFinalResults) {
        const finalSummary = getActiveSessionSummary();
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {finalSummary && activeSession.status === 'completed' && (
                    <ScoreResultCard 
                        scores={finalSummary} 
                        settings={activeSession.settings} 
                        isSessionSummary={true}
                        sessionName={activeSession.name}
                    />
                )}
                <Button color="primary" onPress={() => setShowSessionFinalResults(false)}>
                    スコア計算に戻る
                </Button>
            </motion.div>
        );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card className="bg-content1">
          <CardBody>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                    {activeSession.name} - {activeSession.currentRound}半荘目
                </h2>
                <Button variant="flat" color="danger" onPress={handleCompleteSessionFlow} startContent={<Icon icon="lucide:flag-checkered"/>}>
                    対局会を終了
                </Button>
            </div>
            <div className="space-y-4 mb-6">
              {activeSession.players.map((player, index) => (
                <div key={player.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Avatar name={player.name.charAt(0).toUpperCase()} />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  <Input
                    type="number"
                    label="素点"
                    value={sessionRoundScores[index]?.toString() ?? activeSession.settings.startingPoints.toString()}
                    onValueChange={(value) => handleSessionScoreChange(index, value)}
                    endContent={<span className="text-default-400">点</span>}
                    color={sessionTotalPointsError ? "danger" : "default"}
                  />
                </div>
              ))}
              {sessionTotalPointsError && (
                <p className="text-danger text-sm">
                  <Icon icon="lucide:alert-circle" className="inline-block mr-1" />
                  合計点数が{activeSession.settings.startingPoints * 4}点になるように調整してください
                  (現在: {sessionRoundScores.reduce((sum, score) => sum + (score || 0), 0)}点)
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <Button 
                color="primary" 
                onPress={handleRecordAndNextRound} 
                isDisabled={sessionTotalPointsError}
                startContent={<Icon icon="lucide:arrow-right-circle"/>}
              >
                記録して次の半荘へ
              </Button>
            </div>
          </CardBody>
        </Card>
        <SessionSummaryCard session={activeSession} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-content1">
            <CardBody>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">スコア計算</h2>
                    <Button color="secondary" onPress={sessionSetupModal.onOpen} startContent={<Icon icon="lucide:users"/>}>
                        新しい対局会を始める
                    </Button>
                </div>
                <p className="text-sm text-default-500 mb-2">単独の対局を記録する場合はこちら:</p>
                <div>
                    <h3 className="text-md font-medium mb-2">ルール設定</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input type="number" label="持ち点" value={singleGameSettings.startingPoints.toString()} onValueChange={(v) => setSingleGameSettings(s => ({...s, startingPoints: parseInt(v) || 0}))} endContent="点"/>
                    <Input type="number" label="返し点" value={singleGameSettings.returnPoints.toString()} onValueChange={(v) => setSingleGameSettings(s => ({...s, returnPoints: parseInt(v) || 0}))} endContent="点"/>
                    <Select label="ウマ" selectedKeys={[singleGameSettings.uma]} onChange={(e) => setSingleGameSettings(s => ({...s, uma: e.target.value}))}>
                        <SelectItem key="なし">なし</SelectItem>
                        <SelectItem key="5-10">5-10</SelectItem>
                        <SelectItem key="10-20">10-20</SelectItem>
                        <SelectItem key="10-30">10-30</SelectItem>
                        <SelectItem key="20-40">20-40</SelectItem>
                    </Select>
                    </div>
                </div>
                <Divider className="my-6"/>
                <div>
                    <h3 className="text-md font-medium mb-2">プレイヤースコア</h3>
                    <div className="space-y-4">
                    {singleGamePlayerScores.map((player, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={`プレイヤー ${index + 1}`} placeholder="名前を入力" value={player.name} onValueChange={(v) => handleSinglePlayerNameChange(index, v)} list={`players-list-${index}`}/>
                        <datalist id={`players-list-${index}`}> {globalPlayers.map(p => (<option key={p.id} value={p.name} />))} </datalist>
                        <Input type="number" label="素点" value={player.rawScore.toString()} onValueChange={(v) => handleSingleScoreChange(index, v)} endContent="点" color={singleGameTotalPointsError ? "danger" : "default"}/>
                        </div>
                    ))}
                    {singleGameTotalPointsError && (
                        <p className="text-danger text-sm"><Icon icon="lucide:alert-circle" className="inline-block mr-1" />合計点数が{singleGameSettings.startingPoints * 4}点にしてください (現在: {singleGamePlayerScores.reduce((s, p) => s + p.rawScore, 0)}点)</p>
                    )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end mt-6">
                    <Button color="primary" onPress={calculateSingleGameScores} startContent={<Icon icon="lucide:calculator" />} isDisabled={singleGameTotalPointsError}>計算する</Button>
                </div>
            </CardBody>
        </Card>
      </motion.div>
      
      {showSingleGameResults && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <ScoreResultCard scores={singleGameCalculatedScores} settings={singleGameSettings} />
          <div className="mt-6 space-y-4">
            <Card className="bg-content1">
              <CardBody>
                <h3 className="text-lg font-medium mb-4">追加情報 (任意)</h3>
                <Accordion>
                  <AccordionItem key="1" aria-label="対局メモ" title="対局メモ" startContent={<Icon icon="lucide:file-text" />}>
                    <div className="space-y-4 py-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="font-medium">ハイライト:</p>
                        {highlights.map((h, i) => ( <Chip key={i} onClose={() => setHighlights(prev => prev.filter((_,idx) => idx !== i))} variant="flat">{h.text}</Chip> ))}
                        <Button size="sm" variant="flat" color="primary" onPress={highlightModal.onOpen} startContent={<Icon icon="lucide:plus" />}>追加</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <p className="font-medium">タグ:</p>
                        {tags.map((t, i) => ( <Chip key={i} onClose={() => handleRemoveTag(t)} variant="flat">{t}</Chip> ))}
                        <Input size="sm" placeholder="タグを追加してEnter" className="max-w-[150px]" onKeyDown={(e) => { if (e.key === 'Enter') { handleAddTag((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '';}}}/>
                      </div>
                      <Input label="対局場所" placeholder="例: 〇〇雀荘" value={venue} onValueChange={setVenue}/>
                    </div>
                  </AccordionItem>
                  <AccordionItem key="2" aria-label="精算" title="精算" startContent={<Icon icon="lucide:wallet" />}>
                    <div className="py-2">
                        {expenses.length > 0 ? (
                             <div><Button onPress={expenseModal.onOpen}>経費を編集</Button></div>
                        ) : (
                            <Button color="primary" variant="flat" onPress={expenseModal.onOpen} startContent={<Icon icon="lucide:plus"/>}>経費を追加</Button>
                        )}
                    </div>
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="flat" onPress={resetSingleGameCalculator} startContent={<Icon icon="lucide:refresh-cw" />}>リセット</Button>
              <Button color="primary" onPress={saveConfirmModal.onOpen} startContent={<Icon icon="lucide:save" />}>対局を保存</Button>
            </div>
          </div>
        </motion.div>
      )}

      <SessionSetup 
        isOpen={sessionSetupModal.isOpen}
        onClose={sessionSetupModal.onClose}
        onSessionStart={handleStartNewSession}
      />
      
      <Modal isOpen={saveConfirmModal.isOpen} onOpenChange={saveConfirmModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <><ModalHeader>対局を保存しますか？</ModalHeader>
            <ModalBody><p>この対局結果をライフログに保存します。</p></ModalBody>
            <ModalFooter>
                <Button variant="flat" onPress={onClose}>キャンセル</Button>
                <Button color="primary" onPress={saveSingleGameRecord}>保存する</Button>
            </ModalFooter></>
          )}
        </ModalContent>
      </Modal>
      
      <Modal isOpen={highlightModal.isOpen} onOpenChange={highlightModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <><ModalHeader>ハイライトを追加</ModalHeader>
            <ModalBody>
                <Textarea label="内容" value={newHighlight.text} onValueChange={(v) => setNewHighlight(p => ({...p, text:v}))}/>
            </ModalBody>
            <ModalFooter>
                <Button variant="flat" onPress={onClose}>キャンセル</Button>
                <Button color="primary" onPress={handleAddHighlight} isDisabled={!newHighlight.text.trim()}>追加</Button>
            </ModalFooter></>
          )}
        </ModalContent>
      </Modal>

      {expenseModal.isOpen && (
        <ExpenseCalculator
          players={
            singleGameCalculatedScores.length > 0
              ? singleGameCalculatedScores
              : (activeSession 
                  ? activeSession.players.map((p): PlayerScore => ({
                      playerId: p.id,
                      name: p.name,
                      rawScore: 0,
                      finalScore: 0, 
                    }))
                  : [])
          }
          expenses={expenses}
          onClose={expenseModal.onClose}
          onSave={handleExpensesUpdate}
        />
      )}
    </div>
  );
};