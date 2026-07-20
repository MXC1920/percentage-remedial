import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { ArrowRight, Lightbulb, Info, CheckCircle2 } from 'lucide-react';

import type { GameData, Story, Character } from './types';
import { GameStageLayout } from './components/GameStageLayout';
import gameDataRaw from './data/GameData.json';

const gameData = gameDataRaw as GameData;

export default function App() {
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const { width, height } = useWindowSize();
  
  // Game states for interactive bits
  const [mcqAnswer, setMcqAnswer] = useState<string | null>(null);
  const [fillBlanksState, setFillBlanksState] = useState<Record<string, string>>({});
  const [dragComplete, setDragComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCalcComplete, setIsCalcComplete] = useState(false);

  // Flatten the flow
  const buildFlow = () => {
    const steps: any[] = [];
    steps.push({ type: 'WELCOME' });
    
    gameData.stories.forEach((story, sIdx) => {
      story.screens.forEach(screen => {
        // Skip hint screens, we will merge them into their respective calculation screens
        if (screen.screenId.includes('hints')) return;
        
        // Find if there is a matching hint screen
        const hintScreen = story.screens.find(s => s.screenId === screen.screenId.replace('calculation', 'hints'));
        
        steps.push({ 
          type: 'SCREEN', 
          story, 
          screen: { ...screen, hints: screen.hints || hintScreen?.hints } 
        });
      });
      if (sIdx < gameData.stories.length - 1) {
        steps.push({ type: 'LEVEL_COMPLETE', level: sIdx + 1 });
      }
    });

    steps.push({ type: 'FINAL_LEARNING' });
    return steps;
  };

  const [flow] = useState(buildFlow());

  const currentStep = currentStepIdx === -1 ? flow[0] : flow[currentStepIdx + 1];

  const handleNext = () => {
    if (currentStepIdx < flow.length - 2) {
      const { story, screen } = currentStep;
      const isBlanks = screen?.question && screen.question.fillBlanks;
      
      if (isBlanks) {
        const charName = screen.title?.split("'")?.[0]; 
        const char = story?.characters?.find((c: any) => c.name === charName);
        if (char) {
           const expectedPercent = parseInt(char.sharePercentage?.replace('%', '') || '0');
           const expectedAns = (expectedPercent / 100) * char.quantity;
           if (parseInt(fillBlanksState.num) !== expectedPercent || parseInt(fillBlanksState.ans) !== expectedAns) {
              setShowHint(true);
              return; // Incorrect, stop and show hint
           }
        }
      }

      setCurrentStepIdx(prev => prev + 1);
      // Reset interaction states
      setMcqAnswer(null);
      setFillBlanksState({});
      setDragComplete(false);
      setShowHint(false);
      setIsCalcComplete(false);
    }
  };

  const handleRestart = () => {
    setCurrentStepIdx(-1);
    setMcqAnswer(null);
    setFillBlanksState({});
    setDragComplete(false);
    setShowHint(false);
    setIsCalcComplete(false);
  };

  const renderScreen = () => {
    if (currentStep.type === 'WELCOME') {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[60vh] gap-8 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl font-black text-slate-800 leading-tight">
            {gameData.moduleTitle}
          </h1>
          <p className="text-xl text-slate-600 font-medium max-w-lg">
            {gameData.learningObjective}
          </p>
          <button 
            onClick={handleNext}
            className="mt-4 px-10 py-5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl rounded-full shadow-[0_8px_0_#2563eb] active:shadow-[0_0px_0_#2563eb] active:translate-y-2 transition-all"
          >
            Start Journey
          </button>
        </motion.div>
      );
    }

    if (currentStep.type === 'LEVEL_COMPLETE') {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[60vh] gap-8 max-w-2xl mx-auto text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />
          <div className="text-8xl">🌟</div>
          <h1 className="text-5xl font-black text-green-600 leading-tight">
            Great! Level {currentStep.level} Complete
          </h1>
          <button 
            onClick={handleNext}
            className="mt-4 px-10 py-5 bg-green-500 hover:bg-green-600 text-white font-bold text-2xl rounded-full shadow-[0_8px_0_#16a34a] active:translate-y-2 transition-all"
          >
            Continue
          </button>
        </motion.div>
      );
    }

    if (currentStep.type === 'FINAL_LEARNING') {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[60vh] gap-8 max-w-3xl mx-auto text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Confetti width={width} height={height} numberOfPieces={400} />
          <div className="text-8xl">🎉</div>
          <h1 className="text-4xl font-black text-slate-800 leading-tight">
            You've Mastered Percentages!
          </h1>
          <div className="bg-green-50 p-8 rounded-3xl border-4 border-green-300 w-full">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Core Takeaways:</h2>
            {gameData.stories.map((story: Story) => (
              <p key={story.storyId} className="text-xl text-slate-700 mb-4 font-medium italic">
                "{story.takeaway}"
              </p>
            ))}
          </div>
          <button 
            onClick={handleRestart}
            className="mt-4 px-10 py-5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl rounded-full shadow-[0_8px_0_#2563eb] active:translate-y-2 transition-all"
          >
            Play Again
          </button>
        </motion.div>
      );
    }

    const { story, screen } = currentStep;
    const isMCQ = screen.question && screen.question.type === 'mcq';
    const isBlanks = screen.question && screen.question.fillBlanks;
    
    // Check if step can proceed
    let canProceed = true;
    if (isMCQ && mcqAnswer !== screen.question.correctAnswer) canProceed = false;
    if (isBlanks) {
      if (!fillBlanksState.num || !fillBlanksState.ans) canProceed = false;
    }
    // Simulation of drag drop
    if (screen.studentTask && screen.studentTask.toString().toLowerCase().includes('drag')) {
      if (!dragComplete) canProceed = false;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 w-full max-w-screen-xl mx-auto">
        
        {/* Main Combined Context & Question Banner */}
        {screen.type !== 'WELCOME' && screen.type !== 'LEVEL_COMPLETE' && (
          <div className="w-full max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-3xl shadow-sm border-4 border-slate-200 text-center z-20 flex flex-col gap-3">
            
            {/* Title */}
            <h2 className="text-3xl font-black text-slate-800">{screen.title}</h2>
            
            {/* Intro Paragraph (Single line) */}
            {screen.content && (
              <p className="text-xl font-medium text-slate-600 leading-relaxed">
                {screen.content.join(" ")}
              </p>
            )}

            {/* Scenario Highlighting Block */}
            {story && story.characters && (
              <div className="w-full flex flex-row items-center justify-center gap-3 flex-wrap mt-2 bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                <span className="font-bold text-slate-500 mr-2 flex items-center gap-2">
                  <Info size={20} className="text-blue-500"/> Scenario:
                </span>
                {story.characters.filter((c: Character) => c.sharePercentage).map((src: Character, idx: number, arr: any[]) => {
                  const target = story.characters.find((c: Character) => !c.sharePercentage);
                  const isActive = screen.title?.includes(src.name) || screen.studentTask?.toString().includes(src.name);
                  return (
                    <div key={src.name} className="flex items-center gap-3">
                       <span className={`px-4 py-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-amber-100 border-2 border-amber-400 font-extrabold text-amber-900 shadow-sm scale-110' : 'text-slate-600 font-medium bg-white border border-transparent'}`}>
                          {src.name} has {src.quantity} {src.item} and gives {src.sharePercentage} to {target?.name}.
                       </span>
                       {idx < arr.length - 1 && <span className="text-slate-300 font-black">|</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {!isMCQ ? (
          <>
          <GameStageLayout story={story} screen={screen} onComplete={() => setDragComplete(true)}>
            {screen.animationSteps && (
              <AnimatedFractionCalculation steps={screen.animationSteps} onComplete={() => setIsCalcComplete(true)} />
            )}

            {isBlanks && (
              <div className="mt-8 flex flex-col gap-6 items-center bg-white p-8 rounded-3xl shadow-lg border-4 border-slate-200">
                <p className="text-lg sm:text-xl font-bold text-slate-700 text-center w-full relative">
                  {screen.question.text}
                </p>
                <div className="flex flex-col items-center relative w-full px-1">
                  <div className="w-full max-w-sm flex justify-center items-center gap-2 sm:gap-3 text-lg font-black text-slate-600 bg-slate-50 px-1 py-4 sm:p-5 rounded-2xl border-4 border-slate-200 mt-2">
                    <div className="flex flex-col items-center justify-center w-12 sm:w-14">
                      <input 
                        type="text" 
                        value={fillBlanksState.num || ''} 
                        onChange={(e) => setFillBlanksState(p => ({...p, num: e.target.value}))}
                        className="w-12 sm:w-14 h-10 sm:h-12 text-center border-4 border-slate-300 rounded-lg focus:outline-none focus:border-blue-400 text-lg font-black"
                        placeholder="?"
                      /> 
                      <div className="w-full h-1 bg-slate-400 rounded-full my-1"></div>
                      <span className="text-lg font-black text-slate-500">{screen.question.fillBlanks.percentageFraction.denominator}</span> 
                    </div>
                    <span className="mx-0.5">×</span>
                    <span className="text-xl sm:text-2xl text-slate-700">{screen.question.fillBlanks.multiplicationExpression.split('×')[1]?.trim() || '?'}</span>
                    <span className="mx-0.5">=</span>
                    <input 
                      type="text" 
                      value={fillBlanksState.ans || ''} 
                      onChange={(e) => setFillBlanksState(p => ({...p, ans: e.target.value}))}
                      className="w-12 sm:w-16 h-10 sm:h-12 text-center border-4 border-slate-300 rounded-lg focus:outline-none focus:border-blue-400 text-lg font-black text-blue-600"
                      placeholder="Ans"
                    />
                    
                    {screen.hints && (
                      <button 
                        onClick={() => setShowHint(!showHint)}
                        className="absolute -right-4 -top-4 w-12 h-12 bg-yellow-400 hover:bg-yellow-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white transition-transform hover:scale-110 z-10"
                        title="Need a hint?"
                      >
                         <Lightbulb size={24} className="fill-white" />
                      </button>
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {screen.hints && showHint && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="mt-6 bg-yellow-50 border-4 border-yellow-200 p-6 rounded-3xl w-full max-w-lg origin-top overflow-hidden"
                      >
                        <h3 className="font-bold text-yellow-800 text-lg mb-4 flex items-center gap-2">
                          <Lightbulb size={24} /> Let's break it down:
                        </h3>
                        <ul className="list-disc pl-6 space-y-2">
                          {screen.hints.map((hint: string, i: number) => (
                            <li key={i} className="text-yellow-700 font-medium text-lg">{hint}</li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {screen.studentTask && (!screen.animationSteps || isCalcComplete) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-4 bg-[#7a3b38] border-2 border-[#542724] rounded-2xl flex flex-col items-center gap-4 text-white shadow-lg mx-auto w-max max-w-sm"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 text-center">
                  <Info size={24} className="text-yellow-300" /> {Array.isArray(screen.studentTask) ? screen.studentTask.join(' and ') : screen.studentTask}
                </h3>
              </motion.div>
            )}
          </GameStageLayout>

          <button 
            onClick={handleNext}
            disabled={!canProceed}
            className={`px-10 py-4 font-bold text-2xl rounded-full transition-all flex justify-center items-center gap-3 mt-4 mx-auto w-max z-30 relative
              ${canProceed ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_8px_0_#2563eb] active:translate-y-2' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-[0_8px_0_#94a3b8]'}`}
          >
            {canProceed ? 'Submit' : 'Waiting...'} <ArrowRight size={24} />
          </button>
        </>
        ) : (
          <div className="bg-white p-8 rounded-3xl border-4 border-slate-200 shadow-sm w-full max-w-3xl">
            {isMCQ && (
              <div className="flex flex-col gap-6 items-center">
                <p className="text-3xl font-black text-slate-800 text-center">{screen.question.text}</p>
                <div className="flex flex-col w-full gap-4 mt-4">
                  {screen.question.options.map((opt: string) => {
                    const isSelected = mcqAnswer === opt;
                    const isCorrect = opt === screen.question.correctAnswer;
                    const showFeedback = mcqAnswer !== null && isSelected;
                    
                    return (
                      <button
                        key={opt}
                        onClick={() => setMcqAnswer(opt)}
                        className={`px-6 py-4 font-bold text-2xl rounded-2xl transition-all border-4 text-left flex justify-between items-center
                          ${isSelected ? (isCorrect ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800') : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400'}`}
                      >
                        {opt}
                        {showFeedback && isCorrect && <CheckCircle2 className="text-green-600" size={32} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {screen.results && (
               <div className="mt-8 flex justify-center gap-8">
                 {screen.results.map((res: string, i: number) => (
                   <div key={i} className="bg-blue-100 border-4 border-blue-400 px-6 py-4 rounded-2xl text-blue-900 font-bold text-xl">
                     {res}
                   </div>
                 ))}
               </div>
            )}

            <button 
              onClick={handleNext}
              disabled={!canProceed}
              className={`px-10 py-5 font-bold text-2xl rounded-full transition-all flex items-center gap-3 mt-10 mx-auto
                ${canProceed ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_8px_0_#2563eb] active:translate-y-2' : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-[0_8px_0_#94a3b8]'}`}
            >
              {canProceed ? 'Next Step' : 'Select an Answer to Continue'} <ArrowRight size={24} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-10 lg:p-12 flex flex-col bg-[#f0fdf4]">
      <header className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl text-white shadow-sm font-black rotate-3">
            %
          </div>
          <span className="font-extrabold text-2xl text-slate-800 tracking-tight">PercentPro</span>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border-2 border-slate-200 shadow-sm">
          <span className="font-bold text-slate-500">Progress</span>
          <div className="flex items-center gap-2">
            {gameData.stories.map((story, i) => {
               const activeStoryIndex = currentStep.story ? gameData.stories.findIndex(s => s.storyId === currentStep.story?.storyId) : (currentStep.type === 'LEVEL_COMPLETE' ? 99 : -1);
               
               let fillPercent = 0;
               if (activeStoryIndex > i) {
                 fillPercent = 100;
               } else if (activeStoryIndex === i) {
                 const stepsInStory = flow.filter(f => f.story?.storyId === story.storyId);
                 const stepIdxInStory = stepsInStory.findIndex(f => f.screen?.screenId === currentStep.screen?.screenId);
                 if (stepIdxInStory >= 0 && stepsInStory.length > 1) {
                   fillPercent = Math.max(5, (stepIdxInStory / (stepsInStory.length - 1)) * 100);
                 } else if (stepIdxInStory === 0) {
                   fillPercent = 10; // Start with a tiny bit
                 }
               }

               return (
                 <div key={i} className="h-3 w-16 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                   <div 
                     className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out" 
                     style={{ width: `${fillPercent}%` }} 
                   />
                 </div>
               );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.story?.storyId || currentStep.type}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-1 flex flex-col"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// Custom component to play through the calculation sequentially
function AnimatedFractionCalculation({ steps, onComplete }: { steps: string[], onComplete: () => void }) {
  const [currentAnimStep, setCurrentAnimStep] = useState(0);

  useEffect(() => {
    if (currentAnimStep >= steps.length) {
      onComplete();
    }
  }, [currentAnimStep, steps.length, onComplete]);

  const handleNextStep = () => {
    if (currentAnimStep < steps.length) setCurrentAnimStep(p => p + 1);
  };

  const handlePrevStep = () => {
    if (currentAnimStep > 0) setCurrentAnimStep(p => p - 1);
  };

  const showFraction = currentAnimStep >= 1;
  const showAnswer = currentAnimStep >= steps.length - 2;

  const percentageStr = steps[0]?.match(/(\d+)%/)?.[1] || "?";
  const multMatch = steps[1]?.match(/×\s*(\d+)/);
  const multStr = multMatch ? multMatch[1] : "?";
  const ansMatch = steps[steps.length - 1]?.match(/will give (\d+)/) || steps[steps.length - 2]?.match(/=\s*(\d+)/);
  const ansStr = ansMatch ? ansMatch[1] : "?";

  const currentInstruction = currentAnimStep < steps.length ? steps[currentAnimStep] : steps[steps.length - 1];

  return (
    <div className="flex flex-col gap-6 items-center mt-6 w-full max-w-full">
      <div className="flex items-stretch justify-center gap-2 w-full px-1">
        <button 
          onClick={handlePrevStep}
          disabled={currentAnimStep === 0}
          className={`flex-shrink-0 p-2 rounded-full border-4 shadow-sm transition-all flex items-center justify-center ${currentAnimStep > 0 ? 'bg-white border-blue-400 text-blue-600 hover:bg-blue-50' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ArrowRight size={20} className="rotate-180" />
        </button>

        <motion.div 
          animate={{ scale: [0.95, 1] }}
          transition={{ duration: 0.15 }}
          className="p-4 sm:p-5 bg-amber-50 border-4 border-amber-400 rounded-2xl text-lg sm:text-xl font-bold text-amber-900 shadow-sm text-center flex-1 min-h-[90px] flex items-center justify-center transform transition-all duration-300"
        >
          {currentInstruction}
        </motion.div>

        <button 
          onClick={handleNextStep}
          disabled={currentAnimStep >= steps.length}
          className={`flex-shrink-0 p-2 rounded-full border-4 shadow-sm transition-all flex items-center justify-center ${currentAnimStep < steps.length ? 'bg-white border-blue-400 text-blue-600 hover:bg-blue-50' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ArrowRight size={20} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 text-3xl font-black text-slate-600 bg-white p-8 rounded-3xl border-4 border-slate-200 shadow-sm transition-all min-h-[150px] min-w-[280px]">
        <AnimatePresence>
          {showFraction && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center w-20"
            >
              <div className="text-blue-600">{percentageStr}</div>
              <div className="w-full h-1.5 bg-slate-400 rounded-full my-2"></div>
              <div className="text-slate-500">100</div> 
            </motion.div>
          )}
        </AnimatePresence>
        
        {showFraction && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>×</motion.span>}
        
        {showFraction && (
          <motion.span 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl text-slate-700"
          >
            {multStr}
          </motion.span>
        )}
        
        {showAnswer && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>=</motion.span>}
        
        {showAnswer && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="text-green-600 text-4xl bg-green-100 px-6 py-2 rounded-xl"
          >
            {ansStr}
          </motion.div>
        )}
      </div>
    </div>
  );
}
