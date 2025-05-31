import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Player, GameSettings } from '../types';
import { AppContext } from '../contexts/AppContext';

interface SessionSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStart: (sessionName: string, players: Player[], settings: GameSettings) => void;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({ isOpen, onClose, onSessionStart }) => {
  const { players: globalPlayers, addPlayer, getDefaultSettings } = React.useContext(AppContext);
  const [sessionName, setSessionName] = React.useState<string>(`対局会 ${new Date().toLocaleDateString()}`);
  const [selectedPlayers, setSelectedPlayers] = React.useState<(Player | { name: string })[]>(
    Array(4).fill({ name: '' })
  );
  const [settings, setSettings] = React.useState<GameSettings>(getDefaultSettings());
  const [playerInputValues, setPlayerInputValues] = React.useState<string[]>(Array(4).fill(''));

  const handlePlayerInputChange = (index: number, value: string) => {
    const newValues = [...playerInputValues];
    newValues[index] = value;
    setPlayerInputValues(newValues);

    const newSelectedPlayers = [...selectedPlayers];
    const existingGlobalPlayer = globalPlayers.find(p => p.name === value);
    if (existingGlobalPlayer) {
      newSelectedPlayers[index] = existingGlobalPlayer;
    } else {
      newSelectedPlayers[index] = { name: value }; // IDなしの新規プレイヤー候補
    }
    setSelectedPlayers(newSelectedPlayers);
  };
  
  const handlePlayerSelect = (index: number, playerId: string) => {
    const player = globalPlayers.find(p => p.id === playerId);
    if (player) {
        const newSelectedPlayers = [...selectedPlayers];
        newSelectedPlayers[index] = player;
        setSelectedPlayers(newSelectedPlayers);
        
        const newInputValues = [...playerInputValues];
        newInputValues[index] = player.name;
        setPlayerInputValues(newInputValues);
    }
  };


  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'startingPoints' || key === 'returnPoints' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = () => {
    const finalPlayers: Player[] = selectedPlayers.map((p, idx) => {
      if ('id' in p && p.id) return p as Player; // 既存プレイヤー
      // 新規プレイヤーの場合、addPlayerを試みる（実際にはAppContextのstartNewSession内で処理される）
      return { id: `new-${idx}-${Date.now()}`, name: p.name.trim() || `プレイヤー ${idx + 1}` };
    });

    if (finalPlayers.some(p => !p.name.trim())) {
      // AppContext内でtoastを呼ぶ想定なのでここでは何もしないか、別途toastを呼ぶ
      alert("すべてのプレイヤー名を入力してください。");
      return;
    }
    // 重複プレイヤーチェック
    const playerNames = finalPlayers.map(p => p.name);
    if (new Set(playerNames).size !== playerNames.length) {
        alert("プレイヤー名が重複しています。");
        return;
    }

    onSessionStart(sessionName.trim(), finalPlayers, settings);
    onClose(); // モーダルを閉じる
  };
  
  // Reset state when modal opens/closes if needed
  React.useEffect(() => {
    if (isOpen) {
      setSettings(getDefaultSettings());
      setSelectedPlayers(Array(4).fill({ name: '' }));
      setPlayerInputValues(Array(4).fill(''));
      setSessionName(`対局会 ${new Date().toLocaleDateString()}`);
    }
  }, [isOpen, getDefaultSettings]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl">
      <ModalContent>
        {(modalOnClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">新しい対局会を始める</ModalHeader>
            <ModalBody className="space-y-6">
              <Input
                label="対局会名"
                value={sessionName}
                onValueChange={setSessionName}
                placeholder={`例: 週末麻雀 ${new Date().toLocaleDateString()}`}
              />
              <div>
                <h3 className="text-md font-medium mb-2">プレイヤー選択 (4名)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedPlayers.map((player, index) => (
                    <div key={index} className="space-y-1">
                       <Input
                        label={`プレイヤー ${index + 1}`}
                        placeholder="名前を入力または選択"
                        value={playerInputValues[index]}
                        onValueChange={(value) => handlePlayerInputChange(index, value)}
                        list={`player-list-session-${index}`}
                        endContent={
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button isIconOnly variant="light" size="sm">
                                        <Icon icon="lucide:users" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu 
                                    aria-label={`プレイヤー ${index + 1} 選択`}
                                    onAction={(key) => handlePlayerSelect(index, key as string)}
                                    disabledKeys={selectedPlayers.filter(p => 'id' in p && p.id).map(p => (p as Player).id)}
                                >
                                    {globalPlayers.map(gp => (
                                        <DropdownItem key={gp.id} textValue={gp.name}>
                                            <div className="flex items-center gap-2">
                                                <Avatar name={gp.name.charAt(0).toUpperCase()} size="sm" />
                                                {gp.name}
                                            </div>
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        }
                      />
                      {player && player.name && !('id' in player && player.id) && (
                        <Chip size="sm" color="secondary" variant="flat">新規</Chip>
                      )}
                       {player && player.name && ('id' in player && player.id) && (
                        <Chip size="sm" color="primary" variant="flat">既存</Chip>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium mb-2">基本ルール設定</h3>
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
                    <SelectItem key="なし">なし</SelectItem>
                    <SelectItem key="5-10">5-10</SelectItem>
                    <SelectItem key="10-20">10-20</SelectItem>
                    <SelectItem key="10-30">10-30</SelectItem>
                    <SelectItem key="20-40">20-40</SelectItem>
                  </Select>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={modalOnClose}>
                キャンセル
              </Button>
              <Button color="primary" onPress={handleSubmit} startContent={<Icon icon="lucide:play" />}>
                対局会を開始
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};