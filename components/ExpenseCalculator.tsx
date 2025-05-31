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
  Card, 
  CardBody 
} from "@heroui/react";
import { Icon } from '@iconify/react';
import { PlayerScore, GameExpense } from '../types';

interface ExpenseCalculatorProps {
  players: PlayerScore[];
  expenses: GameExpense[];
  onClose: () => void;
  onSave: (expenses: GameExpense[]) => void;
}

export const ExpenseCalculator: React.FC<ExpenseCalculatorProps> = ({ 
  players, 
  expenses: initialExpenses, 
  onClose, 
  onSave 
}) => {
  const [expenses, setExpenses] = React.useState<GameExpense[]>(initialExpenses);
  const [newExpense, setNewExpense] = React.useState<GameExpense>({
    type: '',
    amount: 0,
    paymentMethod: 'split'
  });
  
  const [settlements, setSettlements] = React.useState<{from: string, to: string, amount: number}[]>([]);

  React.useEffect(() => {
    calculateSettlements();
  }, [expenses]);

  const handleAddExpense = () => {
    if (newExpense.type && newExpense.amount > 0) {
      setExpenses(prev => [...prev, { ...newExpense }]);
      setNewExpense({
        type: '',
        amount: 0,
        paymentMethod: 'split'
      });
    }
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSettlements = () => {
    if (expenses.length === 0 || players.length === 0) {
      setSettlements([]);
      return;
    }

    // Calculate total amount each player should pay
    const playerPayments: Record<string, number> = {};
    
    // Initialize with game results
    players.forEach(player => {
      playerPayments[player.name] = player.finalScore ? -player.finalScore * 100 : 0;
    });
    
    // Add expenses
    expenses.forEach(expense => {
      if (expense.paymentMethod === 'split') {
        // Split equally
        const amountPerPerson = expense.amount / players.length;
        players.forEach(player => {
          playerPayments[player.name] += amountPerPerson;
        });
      } else if (expense.paymentMethod === 'winner') {
        // Winner pays
        const winner = players.find(p => p.rank === 1);
        if (winner) {
          playerPayments[winner.name] += expense.amount;
        }
      } else if (expense.paymentMethod === 'loser') {
        // Loser pays
        const loser = players.find(p => p.rank === players.length);
        if (loser) {
          playerPayments[loser.name] += expense.amount;
        }
      }
    });
    
    // Calculate settlements
    const newSettlements: {from: string, to: string, amount: number}[] = [];
    
    // Create a list of players who owe money and players who are owed money
    const debtors: {name: string, amount: number}[] = [];
    const creditors: {name: string, amount: number}[] = [];
    
    Object.entries(playerPayments).forEach(([name, amount]) => {
      if (amount > 0) {
        debtors.push({ name, amount });
      } else if (amount < 0) {
        creditors.push({ name, amount: -amount });
      }
    });
    
    // Sort by amount (descending)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    // Calculate settlements
    while (debtors.length > 0 && creditors.length > 0) {
      const debtor = debtors[0];
      const creditor = creditors[0];
      
      const amount = Math.min(debtor.amount, creditor.amount);
      
      newSettlements.push({
        from: debtor.name,
        to: creditor.name,
        amount
      });
      
      debtor.amount -= amount;
      creditor.amount -= amount;
      
      if (debtor.amount <= 0) debtors.shift();
      if (creditor.amount <= 0) creditors.shift();
    }
    
    setSettlements(newSettlements);
  };

  return (
    <Modal 
      isOpen={true} 
      onOpenChange={() => onClose()}
      size="lg"
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">精算計算</ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Add Expense Form */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium">経費を追加</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="項目"
                      placeholder="例: 場代"
                      value={newExpense.type}
                      onValueChange={(value) => setNewExpense(prev => ({ ...prev, type: value }))}
                    />
                    <Input
                      type="number"
                      label="金額"
                      placeholder="0"
                      value={newExpense.amount.toString()}
                      onValueChange={(value) => setNewExpense(prev => ({ ...prev, amount: parseInt(value) || 0 }))}
                      endContent={<span className="text-default-400">円</span>}
                    />
                    <Select
                      label="支払方法"
                      selectedKeys={[newExpense.paymentMethod]}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, paymentMethod: e.target.value as 'split' | 'winner' | 'loser' }))}
                    >
                      <SelectItem key="split" value="split">割り勘</SelectItem>
                      <SelectItem key="winner" value="winner">トップ払い</SelectItem>
                      <SelectItem key="loser" value="loser">ラス払い</SelectItem>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      color="primary"
                      onPress={handleAddExpense}
                      isDisabled={!newExpense.type || newExpense.amount <= 0}
                      startContent={<Icon icon="lucide:plus" />}
                    >
                      追加
                    </Button>
                  </div>
                </div>
                
                {/* Expense List */}
                {expenses.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium mb-2">経費一覧</h3>
                    <div className="space-y-2">
                      {expenses.map((expense, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-default-50 rounded-md">
                          <div>
                            <span className="font-medium">{expense.type}</span>
                            <span className="text-sm text-default-500 ml-2">
                              ({expense.paymentMethod === 'split' ? '割り勘' : 
                                expense.paymentMethod === 'winner' ? 'トップ払い' : 'ラス払い'})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{expense.amount.toLocaleString()}円</span>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="danger"
                              onPress={() => handleRemoveExpense(index)}
                            >
                              <Icon icon="lucide:trash-2" size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Settlement Results */}
                {settlements.length > 0 && (
                  <Card className="bg-content2">
                    <CardBody>
                      <h3 className="text-md font-medium mb-4">精算結果</h3>
                      <div className="space-y-3">
                        {settlements.map((settlement, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="font-medium">{settlement.from}</span>
                              <Icon icon="lucide:arrow-right" className="mx-2" />
                              <span className="font-medium">{settlement.to}</span>
                            </div>
                            <span className="font-bold">{Math.round(settlement.amount).toLocaleString()}円</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onModalClose}>
                キャンセル
              </Button>
              <Button 
                color="primary" 
                onPress={() => {
                  onSave(expenses);
                  onModalClose();
                }}
              >
                保存する
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};