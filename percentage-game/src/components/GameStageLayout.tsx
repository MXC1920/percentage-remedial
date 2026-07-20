import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Story, Character, ScreenContent } from '../types';

interface Props {
  story: Story;
  screen: ScreenContent;
  onComplete: () => void;
  children?: React.ReactNode;
  allowDrag?: boolean;
}

interface DraggableItem {
  id: string;
  val: number;
  type: 'basket10' | 'basket5' | 'single';
  sourceChar: string;
}

function getDenominations(amount: number, charName: string): DraggableItem[] {
  let tens = Math.floor(amount / 10);
  let remainder = amount % 10;
  
  let fives = Math.floor(remainder / 5);
  let ones = remainder % 5;
  
  if (tens > 0 && (fives === 0 || ones < 5)) {
     tens -= 1;
     fives += 2;
  }
  if (fives > 0 && Math.max(ones, 0) < 4) {
     fives -= 1;
     ones += 5;
  }

  const items: DraggableItem[] = [];
  for (let i = 0; i < tens; i++) items.push({ id: `${charName}-10-${i}`, val: 10, type: 'basket10', sourceChar: charName });
  for (let i = 0; i < fives; i++) items.push({ id: `${charName}-5-${i}`, val: 5, type: 'basket5', sourceChar: charName });
  for (let i = 0; i < ones; i++) items.push({ id: `${charName}-1-${i}`, val: 1, type: 'single', sourceChar: charName });
  
  return items;
}

export function GameStageLayout({ story, screen, onComplete, children, allowDrag = true }: Props) {
  const taskText = Array.isArray(screen.studentTask) ? screen.studentTask.join(' ') : (screen.studentTask || '');
  const titleText = screen.title || '';
  
  // All potential sources
  let availableSources = story.characters.filter(c => c.sharePercentage);
  
  // Only the sources active for DRAG in this exact screen step
  let activeSources = availableSources;
  const mentioned = activeSources.filter(c => taskText.includes(c.name) || titleText.includes(c.name));
  
  if (mentioned.length > 0) {
    activeSources = mentioned;
  }
  
  const hasDragAction = screen.studentTask && (screen.studentTask.toString().toLowerCase().includes('drag') || screen.studentTask.toString().toLowerCase().includes('transfer'));
  const canDragNow = hasDragAction && allowDrag;

  // Amount requested per active character
  const targetsRequirement = activeSources.reduce((acc, char) => {
    let p = parseInt(char.sharePercentage!.replace('%', ''));
    acc[char.name] = (p / 100) * char.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Inventory state
  const [sourceInventory, setSourceInventory] = useState<Record<string, DraggableItem[]>>({});
  const [droppedFrom, setDroppedFrom] = useState<Record<string, DraggableItem[]>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize inventory only once per story to keep items persistent across screens/turns!
  useEffect(() => {
    const init: Record<string, DraggableItem[]> = {};
    availableSources.forEach(char => {
      init[char.name] = getDenominations(char.quantity, char.name);
    });
    setSourceInventory(init);
    setDroppedFrom({});
    setErrorMsg(null);
  }, [story.storyId]);

  const checkCompletion = (currentDroppedMap: Record<string, DraggableItem[]>) => {
    let allComplete = true;
    for (const char of activeSources) {
      const sum = (currentDroppedMap[char.name] || []).reduce((acc, it) => acc + it.val, 0);
      if (sum !== targetsRequirement[char.name]) {
        allComplete = false;
        break;
      }
    }
    if (allComplete) {
      setTimeout(() => onComplete(), 500);
    }
  };

  const handleItemClick = (item: DraggableItem, isTargetBox: boolean) => {
    if (!canDragNow) {
      setErrorMsg("Finish the calculation first!");
      return;
    }
    
    setErrorMsg(null);
    const { sourceChar, id, val } = item;

    if (isTargetBox) {
      // In Target Box -> Return to Source Box
      setDroppedFrom(prev => ({
        ...prev,
        [sourceChar]: (prev[sourceChar] || []).filter(it => it.id !== id)
      }));

      setSourceInventory(prev => ({
        ...prev,
        [sourceChar]: [...(prev[sourceChar] || []), item]
      }));
    } else {
      // In Source Box -> Move to Target Box
      if (!activeSources.some(c => c.name === sourceChar)) {
        setErrorMsg(`It's not time for ${sourceChar} to transfer yet.`);
        return;
      }

      const currentlyDropped = droppedFrom[sourceChar] || [];
      const currentSum = currentlyDropped.reduce((sum, it) => sum + it.val, 0);
      const targetSum = targetsRequirement[sourceChar];

      if (currentSum + val > targetSum) {
        setErrorMsg(`Too many! ${sourceChar} only gives ${targetSum}. (Currently trying to give ${currentSum + val})`);
        return;
      }

      setSourceInventory(prev => ({
        ...prev,
        [sourceChar]: (prev[sourceChar] || []).filter(it => it.id !== id)
      }));

      setDroppedFrom(prev => {
        const nextDropped = {
           ...prev,
           [sourceChar]: [...(prev[sourceChar] || []), item]
        };
        checkCompletion(nextDropped);
        return nextDropped;
      });
    }
  };

  const renderItemVisual = (item: DraggableItem, isTargetBox: boolean = false) => {
    const isPizza = item.sourceChar.toLowerCase().includes('emma') || item.sourceChar.toLowerCase().includes('liam');
    let Emoji = isPizza ? '🍕' : '🍎';
    let label = '';
    let sizeClass = '';
    
    if (item.type === 'basket10') {
      label = "10";
      sizeClass = isPizza ? "w-24 h-16 text-[10px] leading-none tracking-tighter" : "w-14 h-14 text-3xl";
      Emoji = isPizza ? '🍕🍕🍕🍕🍕\n🍕🍕🍕🍕🍕' : '📦';
    } else if (item.type === 'basket5') {
      label = "5";
      sizeClass = isPizza ? "w-14 h-12 text-xs leading-none tracking-tighter" : "w-10 h-10 text-xl";
      Emoji = isPizza ? '🍕🍕🍕\n🍕🍕' : '🧺';
    } else {
      label = "1";
      sizeClass = isPizza ? "w-8 h-8 text-sm" : "w-8 h-8 text-lg";
      Emoji = isPizza ? '🍕' : '🍎';
    }

    return (
      <motion.div
        key={item.id}
        onClick={canDragNow ? () => handleItemClick(item, isTargetBox) : undefined}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={canDragNow ? { scale: 1.15 } : {}}
        whileTap={canDragNow ? { scale: 0.95 } : {}}
        className={`${sizeClass} flex flex-col items-center justify-center bg-white border-2 border-slate-300 rounded-md shadow-sm font-black relative ${canDragNow ? 'cursor-pointer hover:border-blue-400 hover:shadow-lg z-10' : ''}`}
        title={canDragNow ? `Click to move ${item.val} items` : ''}
      >
        <span className="absolute -top-2 -right-2 bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center border border-blue-300 text-[10px] font-bold z-20">
          {label}
        </span>
        <span className="whitespace-pre text-center text-sm">{Emoji}</span>
      </motion.div>
    );
  };

  // Safe checks for the 3 characters
  const charLeft = story.characters[0];
  const charRight = story.characters[1];
  const charBottom = story.characters[2];

  const renderBasket = (char: Character) => {
    if (!char) return null;
    
    const isTarget = !char.sharePercentage;
    const isSourceActiveHere = activeSources.some(s => s.name === char.name);
    
    if (isTarget) {
      // TARGET Basket
      const allDropped = availableSources.flatMap(src => droppedFrom[src.name] || []);
      
      return (
        <div className={`flex flex-col items-center p-6 rounded-3xl border-8 shadow-xl transition-all w-full mx-auto min-h-[220px] z-10 border-purple-300 bg-purple-100`}>
          <div className="text-purple-900 font-black text-2xl mb-4 bg-white/60 px-6 py-2 rounded-full border-4 border-purple-200 shadow-sm">
             {char.name}'s Basket
          </div>
          <div className="flex-1 w-full bg-white/60 rounded-2xl border-4 border-dashed border-purple-300 p-4 relative overflow-y-auto min-h-[140px]">
             {allDropped.length === 0 ? (
                <div className="text-center text-purple-400 font-bold text-lg mt-8">Click items to move them here</div>
             ) : (
                <div className="flex flex-wrap gap-2 content-start absolute top-4 left-4 right-4">
                  <AnimatePresence>
                    {allDropped.map((item) => renderItemVisual(item, true))}
                  </AnimatePresence>
                </div>
             )}
          </div>
        </div>
      );
    } else {
      // SOURCE Basket
      return (
        <div className={`flex flex-col items-center bg-blue-50 p-6 rounded-3xl border-8 shadow-lg relative z-10 w-full transition-all duration-300 ${isSourceActiveHere && hasDragAction ? 'border-amber-400 shadow-[0_0_20px_#fbbf24] ring-4 ring-amber-200 scale-105' : 'border-blue-200 scale-100'}`}>
          <div className="text-blue-900 font-black text-xl mb-4 bg-white/70 px-4 py-2 rounded-full border-2 border-blue-200 shadow-sm">
            {char.name}'s Basket
          </div>
          <div className="flex flex-wrap gap-2 content-start relative min-h-[150px] w-full p-4 bg-white/50 rounded-2xl border-2 border-blue-100 shadow-inner">
            <AnimatePresence>
              {sourceInventory[char.name]?.map((item) => renderItemVisual(item, false))}
            </AnimatePresence>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-8 relative mt-4">
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-100 border-4 border-red-500 text-red-700 px-8 py-3 rounded-full font-black z-50 shadow-xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col bg-slate-100 p-4 md:p-8 rounded-[2.5rem] border-8 border-slate-200 gap-6">
        <div className="w-full flex flex-col xl:flex-row justify-between items-stretch gap-6">
          
          {/* Left Source */}
          <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col">
            {renderBasket(charLeft)}
          </div>

          {/* Center Canvas */}
          <div className="flex-1 flex flex-col items-center w-full xl:w-auto xl:min-w-[300px] z-20 overflow-x-auto">
            {children}
          </div>

          {/* Right Source */}
          <div className="w-full xl:w-[320px] flex-shrink-0 flex flex-col">
            {renderBasket(charRight)}
          </div>

        </div>

        {/* Target Receiver (Bottom) */}
        <div className="w-full max-w-xl mx-auto z-10 transition-all mt-4">
          {renderBasket(charBottom)}
        </div>
      </div>
    </div>
  );
}
