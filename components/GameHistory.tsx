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
  useDisclosure
} from "@heroui/react";
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { AppContext } from '../contexts/AppContext';
import { GameRecord } from '../types';
import { GameDetailCard } from './GameDetailCard';

export const GameHistory: React.FC = () => {
  const { gameRecords, deleteGameRecord } = React.useContext(AppContext);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedRecord, setSelectedRecord] = React.useState<GameRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = React.useState<string | null>(null);
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const deleteModal = useDisclosure();
  
  const itemsPerPage = 5;
  
  // Get unique tags and venues
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    gameRecords.forEach(record => {
      if (record.tags) {
        record.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [gameRecords]);
  
  const allVenues = React.useMemo(() => {
    const venues = new Set<string>();
    gameRecords.forEach(record => {
      if (record.venue) {
        venues.add(record.venue);
      }
    });
    return Array.from(venues);
  }, [gameRecords]);
  
  // Filter records
  const filteredRecords = React.useMemo(() => {
    return gameRecords.filter(record => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        record.players.some(player => 
          player.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (record.venue && record.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.highlights && record.highlights.some(h => 
          h.text.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
      // Tag filter
      const matchesTag = !selectedTag || 
        (record.tags && record.tags.includes(selectedTag));
      
      // Venue filter
      const matchesVenue = !selectedVenue || 
        (record.venue === selectedVenue);
      
      return matchesSearch && matchesTag && matchesVenue;
    });
  }, [gameRecords, searchTerm, selectedTag, selectedVenue]);
  
  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const currentRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  const handleViewDetails = (record: GameRecord) => {
    setSelectedRecord(record);
    onOpen();
  };
  
  const handleDeleteConfirm = () => {
    if (recordToDelete) {
      deleteGameRecord(recordToDelete);
      setRecordToDelete(null);
      deleteModal.onClose();
    }
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
            <h2 className="text-xl font-semibold mb-6">対戦履歴</h2>
            
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="プレイヤー名、メモなどで検索"
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  startContent={<Icon icon="lucide:search" />}
                  className="flex-1"
                />
                
                <div className="flex gap-2">
                  <Dropdown>
                    <DropdownTrigger>
                      <Button 
                        variant="flat" 
                        startContent={<Icon icon="lucide:tag" />}
                        endContent={<Icon icon="lucide:chevron-down" size={16} />}
                      >
                        {selectedTag || 'タグ'}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="タグフィルター"
                      onAction={(key) => setSelectedTag(key === 'all' ? null : key.toString())}
                    >
                      <DropdownItem key="all">すべて</DropdownItem>
                      {allTags.map(tag => (
                        <DropdownItem key={tag}>{tag}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                  
                  <Dropdown>
                    <DropdownTrigger>
                      <Button 
                        variant="flat" 
                        startContent={<Icon icon="lucide:map-pin" />}
                        endContent={<Icon icon="lucide:chevron-down" size={16} />}
                      >
                        {selectedVenue || '場所'}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="場所フィルター"
                      onAction={(key) => setSelectedVenue(key === 'all' ? null : key.toString())}
                    >
                      <DropdownItem key="all">すべて</DropdownItem>
                      {allVenues.map(venue => (
                        <DropdownItem key={venue}>{venue}</DropdownItem>
                      ))}
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
              
              {/* Game Records */}
              {gameRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon icon="lucide:file-x" size={48} className="text-default-300 mb-4" />
                  <p className="text-default-500 text-center">
                    対局記録がまだありません。<br />
                    スコア計算タブから対局を記録しましょう。
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon icon="lucide:search-x" size={48} className="text-default-300 mb-4" />
                  <p className="text-default-500 text-center">
                    検索条件に一致する対局記録が見つかりませんでした。<br />
                    検索条件を変更してみてください。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentRecords.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="bg-content2">
                        <CardBody>
                          <div className="flex flex-col md:flex-row justify-between">
                            <div className="mb-4 md:mb-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-medium">
                                  {new Date(record.date).toLocaleDateString()} の対局
                                </h3>
                                {record.venue && (
                                  <Chip size="sm" variant="flat" color="primary">
                                    <Icon icon="lucide:map-pin" size={14} className="mr-1" />
                                    {record.venue}
                                  </Chip>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-2">
                                {record.tags && record.tags.map((tag, i) => (
                                  <Chip key={i} size="sm" variant="flat">
                                    <Icon icon="lucide:tag" size={14} className="mr-1" />
                                    {tag}
                                  </Chip>
                                ))}
                              </div>
                              
                              <div className="flex flex-wrap gap-4">
                                {record.players
                                  .sort((a, b) => (a.rank || 0) - (b.rank || 0))
                                  .map((player, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                      <span className={`font-medium ${i === 0 ? 'text-warning' : ''}`}>
                                        {player.rank}位:
                                      </span>
                                      <span>{player.name}</span>
                                      <span className={player.finalScore && player.finalScore > 0 ? 'text-success' : player.finalScore && player.finalScore < 0 ? 'text-danger' : ''}>
                                        ({player.finalScore?.toFixed(1)}pt)
                                      </span>
                                    </div>
                                  ))}
                              </div>
                              
                              {record.highlights && record.highlights.length > 0 && (
                                <div className="mt-2 text-sm text-default-500">
                                  <Icon icon="lucide:sparkles" size={14} className="inline-block mr-1" />
                                  {record.highlights[0].text}
                                  {record.highlights.length > 1 && ` 他${record.highlights.length - 1}件`}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 self-start md:self-center">
                              <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() => handleViewDetails(record)}
                                startContent={<Icon icon="lucide:eye" size={16} />}
                              >
                                詳細
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() => {
                                  setRecordToDelete(record.id);
                                  deleteModal.onOpen();
                                }}
                                startContent={<Icon icon="lucide:trash-2" size={16} />}
                              >
                                削除
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        total={totalPages}
                        initialPage={1}
                        page={currentPage}
                        onChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </motion.div>
      
      {/* Game Detail Modal */}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="lg"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">対局詳細</ModalHeader>
              <ModalBody>
                {selectedRecord && <GameDetailCard record={selectedRecord} />}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  閉じる
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onOpenChange={deleteModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">対局記録の削除</ModalHeader>
              <ModalBody>
                <p>この対局記録を削除してもよろしいですか？</p>
                <p className="text-danger text-sm">この操作は元に戻せません。</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  キャンセル
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDeleteConfirm}
                >
                  削除する
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};