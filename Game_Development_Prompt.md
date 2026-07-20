# Educational Game Development Prompt for Antigravity

## ROLE

You are a senior Educational Game Designer, Learning Scientist, UI/UX
Designer, React + TypeScript Engineer, Game Developer, and Software
Architect.

Your task is to build a production-quality educational game that helps
students overcome the misconception:

> "A smaller percentage always means a smaller value."

The game must teach students that percentages can only be compared after
considering the size of the whole.

## DESIGN REFERENCE

I will attach screenshots of games developed by my company. Treat them
as the official design reference.

Do NOT copy gameplay or assets. DO copy the overall design language: -
Bright playful colors - Rounded UI - Cartoon illustrations - Bold
typography - 2.5D buttons - Large gameplay canvas - Child-friendly
spacing - Smooth animations - Cheerful feedback - Similar polish and
quality

Analyze the screenshots before implementation and infer: - Color
palette - Typography - Button styles - Card styles - Background style -
Character style - Animation style - Layout hierarchy - Component spacing

The final game should feel like another official game from the same
product family.

## GAMEPLAY

Three students: - Raj - Vipul - Mohan

Example: Raj: 100 apples Vipul: 200 apples Mohan: 0 apples

Question: Raj gives 10% of his apples. Vipul gives 20% of his apples.

Students must calculate first and only then drag apples to Mohan.

Game Flow: Observe → Predict → Calculate → Validate → Unlock Drag → Drag
Apples → Compare → Reflection → Explanation.

Use fraction inputs: Numerator --------- Denominator × Whole

Only correct calculation unlocks drag-and-drop.

Animate apples moving between baskets.

After transfers ask: Who gave more apples? Why?

Explain that percentages depend on the whole.

## PROGRESSION

Levels: Easy Medium Hard Decimals Large numbers Real-life contexts
Income Money Books Water Distance Population

## JSON

Questions must come from JSON only. No hardcoding.

Question object should include: id story persons transfers hint
explanation misconception

## FEEDBACK

Never punish. Use encouraging feedback.

Hints: 1. Convert percentage to fraction. 2. Multiply by whole. 3.
Compare quantities.

## REWARDS

Stars Coins XP Confetti Positive messages

## UI

Responsive Accessible Large buttons Keyboard friendly Touch friendly

## ANIMATIONS

Framer Motion. Bounce. Scale. Apple transfer. Counter animation.
Confetti. Idle character animations.

## COMPONENTS

StudentCard AppleBasket FractionInput QuestionCard TransferAnimation
HintBox RewardPopup ResultModal ProgressBar

## STATE

Question Score Progress Hints Animations Validation

## CODE

React TypeScript TailwindCSS Framer Motion Reusable components Clean
architecture

## SUCCESS

Students should experience an 'Aha!' moment and realize that comparing
percentages alone is incorrect.

Deliver production-ready code with documentation explaining how to add
new questions through JSON only.
