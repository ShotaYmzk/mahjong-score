import React from 'react';
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Pagination,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs, // セッション履歴表示用
  Tab   // セッション履歴表示用
} from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { AppContext } from '../contexts/AppContext';
import { GameRecord, GameSession, PlayerScore } from '../types'; // GameSession をインポート
import { GameDetailCard } from './GameDetailCard';
import { ScoreResultCard } from './ScoreResultCard'; // セッション結果表示用

export const GameHistory: React.FC = () => {
  const { gameRecords, deleteGameRecord, gameSessions, deleteSession } = React.useContext(AppContext); // gameSessions, deleteSession を追加
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedRecord, setSelectedRecord] = React.useState<GameRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = React.useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null); // セッション削除用
  const [selectedSession, setSelectedSession] = React.useState<GameSession | null>(null); // セッション詳細表示用

  const [historyType, setHistoryType] = React.useState<'games' | 'sessions'>('games'); // 表示タイプ切り替え

  const gameDetailModal = useDisclosure();
  const deleteGameModal = useDisclosure();
  const deleteSessionModal = useDisclosure(); // セッション削除確認モーダル
  const sessionDetailModal = useDisclosure(); // セッション詳細モーダル
  
  const itemsPerPage = 5;
  
  const allTags = React.useMemo(() => { /* ... (変更なし) ... */ return []; }, [gameRecords]);
  const allVenues = React.useMemo(() => { /* ... (変更なし) ... */ return []; }, [gameRecords]);
  
  // --- 個別対局履歴 ---
  const filteredGameRecords = React.useMemo(() => {
    return gameRecords.filter(record => {
      const matchesSearch = searchTerm === '' || 
        record.players.some(player => player.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.venue && record.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.highlights && record.highlights.some(h => h.text.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesTag = !selectedTag || (record.tags && record.tags.includes(selectedTag));
      const matchesVenue = !selectedVenue || (record.venue === selectedVenue);
      return matchesSearch && matchesTag && matchesVenue;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [gameRecords, searchTerm, selectedTag, selectedVenue]);
  
  const totalGamePages = Math.ceil(filteredGameRecords.length / itemsPerPage);
  const currentGameRecords = filteredGameRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // --- 対局会履歴 ---
  const filteredGameSessions = React.useMemo(() => {
    return gameSessions.filter(session => {
        return searchTerm === '' ||
            session.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            session.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [gameSessions, searchTerm]);

  const totalSessionPages = Math.ceil(filteredGameSessions.length / itemsPerPage);
  const currentSessions = filteredGameSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  const handleViewGameDetails = (record: GameRecord) => {
    setSelectedRecord(record);
    gameDetailModal.onOpen();
  };

  const handleViewSessionDetails = (session: GameSession) => {
    setSelectedSession(session);
    sessionDetailModal.onOpen();
  };
  
  const handleDeleteGameConfirm = () => {
    if (recordToDelete) {
      deleteGameRecord(recordToDelete);
      setRecordToDelete(null);
      deleteGameModal.onClose();
    }
  };

  const handleDeleteSessionConfirm = () => {
    if (sessionToDelete) {
        deleteSession(sessionToDelete);
        setSessionToDelete(null);
        deleteSessionModal.onClose();
    }
  };

  const renderGameRecordItem = (record: GameRecord, index: number) => (
    <motion.div key={record.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
      <Card className="bg-content2">
        <CardBody>
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium">{new Date(record.date).toLocaleDateString()} の対局</h3>
                {record.venue && <Chip size="sm" variant="flat" color="primary"><Icon icon="lucide:map-pin" width={14} height={14} className="mr-1" />{record.venue}</Chip>}
                {record.sessionId && <Chip size="sm" variant="bordered" color="secondary">対局会</Chip>}
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {record.tags?.map((tag, i) => <Chip key={i} size="sm" variant="flat"><Icon icon="lucide:tag" width={14} height={14} className="mr-1" />{tag}</Chip>)}
              </div>
              <div className="flex flex-wrap gap-4">
                {record.players.sort((a, b) => (a.rank || 0) - (b.rank || 0)).map((player, i) => (
                  <div key={player.playerId || i} className="flex items-center gap-1">
                    <span className={`font-medium ${i === 0 ? 'text-warning' : ''}`}>{player.rank}位:</span>
                    <span>{player.name}</span>
                    <span className={player.finalScore && player.finalScore > 0 ? 'text-success' : player.finalScore && player.finalScore < 0 ? 'text-danger' : ''}>({player.finalScore?.toFixed(1)}pt)</span>
                  </div>
                ))}
              </div>
              {record.highlights && record.highlights.length > 0 && (
                <div className="mt-2 text-sm text-default-500"><Icon icon="lucide:sparkles" width={14} height={14} className="inline-block mr-1" />{record.highlights[0].text}{record.highlights.length > 1 && ` 他${record.highlights.length - 1}件`}</div>
              )}
            </div>
            <div className="flex gap-2 self-start md:self-center">
              <Button size="sm" variant="flat" color="primary" onPress={() => handleViewGameDetails(record)} startContent={<Icon icon="lucide:eye" width={16} height={16} />}>詳細</Button>
              <Button size="sm" variant="flat" color="danger" onPress={() => { setRecordToDelete(record.id); deleteGameModal.onOpen(); }} startContent={<Icon icon="lucide:trash-2" width={16} height={16} />}>削除</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );

  const renderSessionItem = (session: GameSession, index: number) => (
    <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
        <Card className="bg-content2">
            <CardBody>
                <div className="flex flex-col md:flex-row justify-between">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-lg font-medium mb-1">{session.name || `対局会 ${new Date(session.startDate).toLocaleDateString()}`}</h3>
                        <p className="text-sm text-default-500">
                            {new Date(session.startDate).toLocaleString()} - {session.endDate ? new Date(session.endDate).toLocaleString() : '進行中'}
                        </p>
                        <p className="text-sm text-default-500">参加者: {session.players.map(p => p.name).join(', ')}</p>
                        <p className="text-sm text-default-500">{session.gameRecordsInSession.length} 半荘</p>
                    </div>
                    <div className="flex gap-2 self-start md:self-center">
                        <Button size="sm" variant="flat" color="primary" onPress={() => handleViewSessionDetails(session)} startContent={<Icon icon="lucide:eye" width={16} height={16} />}>総合結果</Button>
                        <Button size="sm" variant="flat" color="danger" onPress={() => { setSessionToDelete(session.id); deleteSessionModal.onOpen(); }} startContent={<Icon icon="lucide:trash-2" width={16} height={16} />}>削除</Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    </motion.div>
  );


  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-content1">
          <CardBody>
            <h2 className="text-xl font-semibold mb-6">対戦履歴</h2>
            <Tabs 
                aria-label="履歴タイプ" 
                selectedKey={historyType} 
                onSelectionChange={(key) => { setHistoryType(key as 'games' | 'sessions'); setCurrentPage(1); }}
                className="mb-4"
            >
                <Tab key="games" title={<div className="flex items-center gap-1"><Icon icon="lucide:swords"/>個別対局</div>} />
                <Tab key="sessions" title={<div className="flex items-center gap-1"><Icon icon="lucide:users"/>対局会</div>} />
            </Tabs>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input placeholder={historyType === 'games' ? "プレイヤー名、メモ等で検索" : "対局会名、参加者名で検索"} value={searchTerm} onValueChange={setSearchTerm} startContent={<Icon icon="lucide:search" width={16} height={16} />} className="flex-1"/>
                {historyType === 'games' && (
                <div className="flex gap-2">
                  <Dropdown>
                    <DropdownTrigger><Button variant="flat" startContent={<Icon icon="lucide:tag" width={16} height={16} />} endContent={<Icon icon="lucide:chevron-down" width={16} height={16} />}>{selectedTag || 'タグ'}</Button></DropdownTrigger>
                    <DropdownMenu aria-label="タグフィルター" onAction={(key) => setSelectedTag(key === 'all' ? null : key.toString())}>
                      <>
                        <DropdownItem key="all">すべて</DropdownItem>
                        {allTags.map(tag => (<DropdownItem key={tag}>{tag}</DropdownItem>))}
                      </>
                    </DropdownMenu>
                  </Dropdown>
                  <Dropdown>
                    <DropdownTrigger><Button variant="flat" startContent={<Icon icon="lucide:map-pin" width={16} height={16} />} endContent={<Icon icon="lucide:chevron-down" width={16} height={16} />}>{selectedVenue || '場所'}</Button></DropdownTrigger>
                    <DropdownMenu aria-label="場所フィルター" onAction={(key) => setSelectedVenue(key === 'all' ? null : key.toString())}>
                      <>
                        <DropdownItem key="all">すべて</DropdownItem>
                        {allVenues.map(venue => (<DropdownItem key={venue}>{venue}</DropdownItem>))}
                      </>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                )}
              </div>
              
              {historyType === 'games' && (
                gameRecords.length === 0 ? (
                  <div className="text-center py-12"><Icon icon="lucide:file-x" width={48} height={48} className="text-default-300 mb-4 mx-auto" /><p className="text-default-500">対局記録がまだありません。</p></div>
                ) : filteredGameRecords.length === 0 ? (
                  <div className="text-center py-12"><Icon icon="lucide:search-x" width={48} height={48} className="text-default-300 mb-4 mx-auto" /><p className="text-default-500">検索条件に一致する対局記録が見つかりません。</p></div>
                ) : (
                  <div className="space-y-4">
                    {currentGameRecords.map(renderGameRecordItem)}
                    {totalGamePages > 1 && <div className="flex justify-center mt-6"><Pagination total={totalGamePages} initialPage={1} page={currentPage} onChange={handlePageChange}/></div>}
                  </div>
                )
              )}

              {historyType === 'sessions' && (
                gameSessions.length === 0 ? (
                    <div className="text-center py-12"><Icon icon="lucide:folder-x" width={48} height={48} className="text-default-300 mb-4 mx-auto" /><p className="text-default-500">対局会の記録がまだありません。</p></div>
                ) : filteredGameSessions.length === 0 ? (
                    <div className="text-center py-12"><Icon icon="lucide:search-x" width={48} height={48} className="text-default-300 mb-4 mx-auto" /><p className="text-default-500">検索条件に一致する対局会が見つかりません。</p></div>
                ) : (
                    <div className="space-y-4">
                        {currentSessions.map(renderSessionItem)}
                        {totalSessionPages > 1 && <div className="flex justify-center mt-6"><Pagination total={totalSessionPages} initialPage={1} page={currentPage} onChange={handlePageChange}/></div>}
                    </div>
                )
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      <Modal isOpen={gameDetailModal.isOpen} onOpenChange={gameDetailModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (<><ModalHeader>対局詳細</ModalHeader><ModalBody>{selectedRecord && <GameDetailCard record={selectedRecord} />}</ModalBody><ModalFooter><Button color="primary" onPress={onClose}>閉じる</Button></ModalFooter></>)}
        </ModalContent>
      </Modal>
      
      <Modal isOpen={deleteGameModal.isOpen} onOpenChange={deleteGameModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (<><ModalHeader>対局記録の削除</ModalHeader><ModalBody><p>この対局記録を削除してもよろしいですか？</p><p className="text-danger text-sm">この操作は元に戻せません。</p></ModalBody><ModalFooter><Button variant="flat" onPress={onClose}>キャンセル</Button><Button color="danger" onPress={handleDeleteGameConfirm}>削除する</Button></ModalFooter></>)}
        </ModalContent>
      </Modal>

      {/* Session Detail Modal */}
      <Modal isOpen={sessionDetailModal.isOpen} onOpenChange={sessionDetailModal.onOpenChange} size="2xl">
        <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader>対局会 詳細</ModalHeader>
                    <ModalBody>
                        {selectedSession && (
                            <ScoreResultCard 
                                scores={selectedSession.gameRecordsInSession.reduce((acc, record) => {
                                    record.players.forEach(p => {
                                        const existing = acc.find(ps => ps.playerId === p.playerId);
                                        if (existing) {
                                            existing.finalScore = (existing.finalScore || 0) + (p.finalScore || 0);
                                            existing.rawScore += p.rawScore;
                                        } else {
                                            acc.push({ ...p });
                                        }
                                    });
                                    return acc;
                                }, [] as PlayerScore[]).sort((a,b) => (b.finalScore || 0) - (a.finalScore || 0))
                                .map((s, idx, arr_sorted) => ({...s, rank: arr_sorted.findIndex(x => x.finalScore === s.finalScore) + 1})) // 簡易ランク付け
                              }
                                settings={selectedSession.settings}
                                isSessionSummary={true}
                                sessionName={selectedSession.name}
                            />
                        )}
                        <h4 className="text-md font-medium mt-4 mb-2">各半荘の結果:</h4>
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {selectedSession?.gameRecordsInSession.map(gr => (
                            <Card key={gr.id} className="bg-content2 !shadow-sm">
                                <CardBody className="!p-3">
                                    <p className="text-sm font-medium">{new Date(gr.date).toLocaleTimeString()} 開始</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                    {gr.players.sort((a,b) => (a.rank || 0) - (b.rank || 0)).map(p => (
                                        <span key={p.playerId}>{p.rank}位: {p.name} ({p.finalScore?.toFixed(1)}pt)</span>
                                    ))}
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onPress={onClose}>閉じる</Button>
                    </ModalFooter>
                </>
            )}
        </ModalContent>
      </Modal>

      {/* Delete Session Confirmation Modal */}
      <Modal isOpen={deleteSessionModal.isOpen} onOpenChange={deleteSessionModal.onOpenChange}>
        <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader>対局会の削除</ModalHeader>
                    <ModalBody>
                        <p>この対局会を削除してもよろしいですか？</p>
                        <p className="text-sm text-default-500">この対局会に含まれる個別の対局記録は削除されません。</p>
                        <p className="text-danger text-sm">この操作は元に戻せません。</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={onClose}>キャンセル</Button>
                        <Button color="danger" onPress={handleDeleteSessionConfirm}>削除する</Button>
                    </ModalFooter>
                </>
            )}
        </ModalContent>
      </Modal>
    </div>
  );
};