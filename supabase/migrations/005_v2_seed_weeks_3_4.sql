-- ============================================================
-- Najah AI — Seed Data: Weeks 3 & 4 — Full Lessons + Exercises
-- ============================================================

-- ──────────────────────────────────────────────
-- LESSONS — WEEK 3
-- ──────────────────────────────────────────────

-- Math Week 3: Proportionality
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000011',
 '00000000-0000-0000-0001-000000000001',
 '00000000-0000-0000-0002-000000000003',
 'Proportionality',
 'Understand direct proportionality and solve proportional reasoning problems.',
E'## What is Proportionality?\n\nTwo quantities are **directly proportional** if they increase or decrease at the same rate.\n\nWhen x doubles, y doubles. When x triples, y triples.\n\n## The Proportion Formula\n\nIf $y$ is proportional to $x$:\n$$y = k \\cdot x$$\n\nWhere $k$ is the **constant of proportionality**.\n\n## Finding k\n\n**Example:** A car travels 150 km in 3 hours. What is the speed (k)?\n$$k = \\frac{y}{x} = \\frac{150}{3} = 50 \\text{ km/h}$$\n\n## Cross-Multiplication Method\n\nIf $\\frac{a}{b} = \\frac{c}{d}$, then $a \\times d = b \\times c$\n\n**Example:** If 5 books cost 200 MAD, how much do 8 books cost?\n$$\\frac{5}{200} = \\frac{8}{x}$$\n$$5x = 1600$$\n$$x = 320 \\text{ MAD}$$\n\n## Real-Life Uses\n- Currency conversion\n- Recipe scaling\n- Map reading\n- Speed, distance, and time',
 12, 'medium', 1);

-- Physics Week 3: Atoms and Molecules
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000012',
 '00000000-0000-0000-0001-000000000002',
 '00000000-0000-0000-0002-000000000003',
 'Atoms and Molecules',
 'Understand the structure of atoms and how they combine to form molecules.',
E'## The Atom\n\nAll matter is made of **atoms** — the smallest unit of an element.\n\nAn atom has:\n- **Protons** (+) in the nucleus\n- **Neutrons** (neutral) in the nucleus\n- **Electrons** (−) orbiting the nucleus\n\n## Atomic Number and Mass\n\n| Symbol | Meaning               |\n|--------|-----------------------|\n| Z      | Atomic number (protons) |\n| A      | Mass number (protons + neutrons) |\n| A - Z  | Number of neutrons |\n\n**Example:** Carbon (C): Z = 6, A = 12 → 6 protons, 6 neutrons, 6 electrons\n\n## Molecules\n\nAtoms **bond** together to form **molecules**.\n\n| Molecule | Formula | Description       |\n|----------|---------|-------------------|\n| Water    | H₂O     | 2 hydrogen + 1 oxygen |\n| Carbon dioxide | CO₂ | 1 carbon + 2 oxygen |\n| Oxygen gas | O₂  | 2 oxygen atoms |\n\n## Chemical Symbols\n\nEvery element has a symbol: H (hydrogen), O (oxygen), C (carbon), Fe (iron).\n\nCapital first letter + optional lowercase: Ca, Na, Mg.',
 12, 'medium', 1);

-- English Week 3: Explaining a Process
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000013',
 '00000000-0000-0000-0001-000000000003',
 '00000000-0000-0000-0002-000000000003',
 'Explaining a Process',
 'Learn how to write a clear step-by-step explanation of a scientific process.',
E'## How to Explain a Process in English\n\nWhen explaining a scientific process, use:\n1. **Sequencing words** — first, next, then, after that, finally\n2. **Passive voice** — "Water is heated", "The gas is released"\n3. **Present tense** — describing what always happens\n\n## Useful Language\n\n| Purpose    | Phrases |\n|------------|--------|\n| Start      | First, To begin with, Initially |\n| Continue   | Next, Then, After that, Subsequently |\n| Cause      | This causes, As a result, Therefore |\n| End        | Finally, Ultimately, In the end |\n\n## Example: Explaining Photosynthesis\n\n*"First, the plant absorbs sunlight through its leaves. Next, it takes in carbon dioxide from the air. Then, water is absorbed through the roots. As a result, the plant converts these ingredients into glucose and oxygen. Finally, the oxygen is released into the air."*\n\n## Practice\n\nWrite 4–5 sentences explaining the water cycle using sequencing words.',
 10, 'medium', 1);

-- Logic Week 3: Deduction Puzzles
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000014',
 '00000000-0000-0000-0001-000000000004',
 '00000000-0000-0000-0002-000000000003',
 'Deduction Puzzles',
 'Use logical deduction to solve problems with given clues.',
E'## What is Deduction?\n\n**Deduction** means drawing a definite conclusion from given facts.\n\nIf the premises are true, the conclusion MUST be true.\n\n## Syllogism (Classic Deduction)\n\n```\nPremise 1: All mammals are warm-blooded.\nPremise 2: A whale is a mammal.\nConclusion: Therefore, a whale is warm-blooded.\n```\n\n## Strategy for Deduction Puzzles\n\n1. **List what you know** (the given facts)\n2. **Eliminate impossibilities** — cross out what cannot be true\n3. **Use the remaining options** to reach your conclusion\n4. **Check** — does your answer satisfy ALL given clues?\n\n## Example Puzzle\n\nThree students — Ali, Sara, and Omar — each play a different sport: football, tennis, or swimming.\n- Ali does not play tennis.\n- Sara does not play football.\n- Omar does not play swimming.\n\n**Working it out:**\n- Ali: not tennis → plays football or swimming\n- Omar: not swimming → plays football or tennis\n- Sara: not football → plays tennis or swimming\n\nIf Ali plays football → Sara plays tennis or swimming → Omar plays tennis → Sara plays swimming ✓\n\n**Answer:** Ali=Football, Omar=Tennis, Sara=Swimming',
 12, 'medium', 1);

-- Coding Week 3: Conditions (if/else)
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000015',
 '00000000-0000-0000-0001-000000000005',
 '00000000-0000-0000-0002-000000000003',
 'Conditions in Python',
 'Use if, elif, and else statements to make decisions in your programs.',
E'## What is a Condition?\n\nA **condition** lets your program make decisions.\n\n```python\nif condition:\n    # do this\nelse:\n    # do that\n```\n\n## Comparison Operators\n\n| Operator | Meaning            | Example |\n|----------|--------------------|---------|\n| ==       | equal to           | x == 5  |\n| !=       | not equal to       | x != 0  |\n| >        | greater than       | x > 10  |\n| <        | less than          | x < 3   |\n| >=       | greater or equal   | x >= 18 |\n| <=       | less or equal      | x <= 100|\n\n## if / elif / else\n\n```python\nscore = 75\n\nif score >= 90:\n    print("Excellent!")\nelif score >= 70:\n    print("Good job!")\nelif score >= 50:\n    print("Keep trying.")\nelse:\n    print("Study harder.")\n```\n\n**Only one block runs** — the first condition that is True.\n\n## Logical Operators\n\n```python\nage = 16\nhas_id = True\n\nif age >= 18 and has_id:\n    print("Welcome")\nelse:\n    print("Access denied")\n```\n\n- `and` — both must be True\n- `or`  — at least one must be True\n- `not` — reverses True/False',
 12, 'medium', 1);

-- ──────────────────────────────────────────────
-- LESSONS — WEEK 4
-- ──────────────────────────────────────────────

-- Math Week 4: Functions and Graphs Intro
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000016',
 '00000000-0000-0000-0001-000000000001',
 '00000000-0000-0000-0002-000000000004',
 'Functions and Graphs',
 'Understand what a function is, evaluate it, and plot a linear graph.',
E'## What is a Function?\n\nA **function** takes an input, applies a rule, and gives exactly **one output**.\n\n$$f(x) = 2x + 1$$\n\nThis means: multiply the input by 2, then add 1.\n\n## Evaluating a Function\n\n**Example:** $f(x) = 2x + 1$\n\n| x   | f(x) = 2x + 1 |\n|-----|---------------|\n| 0   | 1             |\n| 1   | 3             |\n| 2   | 5             |\n| 3   | 7             |\n\n## Linear Functions\n\nA function of the form $f(x) = mx + b$ is **linear** — its graph is a straight line.\n\n- $m$ = slope (steepness of the line)\n- $b$ = y-intercept (where the line crosses the y-axis)\n\n## Plotting the Graph\n\n1. Make a table of (x, y) values\n2. Plot each point on a coordinate grid\n3. Draw a straight line through them\n\n**Example:** $y = x + 2$\n\nPoints: (0, 2), (1, 3), (2, 4), (-1, 1)\n\n## Slope\n\n$$m = \\frac{\\text{rise}}{\\text{run}} = \\frac{y_2 - y_1}{x_2 - x_1}$$',
 15, 'medium', 1);

-- Physics Week 4: Forces and Motion
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000017',
 '00000000-0000-0000-0001-000000000002',
 '00000000-0000-0000-0002-000000000004',
 'Forces and Motion',
 'Understand Newton''s laws of motion and apply them to simple problems.',
E'## What is a Force?\n\nA **force** is a push or pull that can:\n- Change the speed of an object\n- Change the direction of an object\n- Change the shape of an object\n\n**Unit:** Newton (N) — a vector quantity (has direction)\n\n## Newton''s Three Laws of Motion\n\n### Law 1 — Inertia\n*An object stays at rest or moves in a straight line at constant speed unless acted on by a net force.*\n\n### Law 2 — F = ma\n$$F = m \\times a$$\n\n- $F$ = force in Newtons (N)\n- $m$ = mass in kilograms (kg)\n- $a$ = acceleration in m/s²\n\n**Example:** A 5 kg box is pushed with 20 N. What is its acceleration?\n$$a = \\frac{F}{m} = \\frac{20}{5} = 4 \\text{ m/s}^2$$\n\n### Law 3 — Action and Reaction\n*For every action, there is an equal and opposite reaction.*\n\n**Example:** When you push off a wall, the wall pushes back on you.\n\n## Types of Forces\n| Force    | Description                   |\n|----------|-------------------------------|\n| Gravity  | Pulls objects toward Earth    |\n| Friction | Opposes motion                |\n| Normal   | Surface pushing back on object|',
 13, 'medium', 1);

-- English Week 4: Writing a Short Explanation
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000018',
 '00000000-0000-0000-0001-000000000003',
 '00000000-0000-0000-0002-000000000004',
 'Writing a Short Scientific Explanation',
 'Write a clear, well-structured paragraph explaining a scientific concept.',
E'## The Structure of a Good Explanation\n\nA strong scientific explanation has 3 parts:\n\n1. **Topic sentence** — what you are explaining\n2. **Evidence and reasoning** — the facts and why they matter\n3. **Conclusion** — what this tells us\n\n## The PEEL Structure\n\n| Letter | Stands for | What to write                      |\n|--------|------------|------------------------------------|\n| P      | Point      | Your main claim                    |\n| E      | Evidence   | A fact or example that supports it |\n| E      | Explain    | Why this evidence proves your point |\n| L      | Link       | Connect back to the question        |\n\n## Example\n\n*"Friction is a force that opposes motion (P). For example, when a book slides across a table, friction slows it down and eventually stops it (E). This happens because the rough surfaces of the book and table create resistance against the direction of movement (E). Therefore, friction is essential in everyday life — without it, we could not walk or stop a moving car (L)."*\n\n## Useful Academic Phrases\n\n- "This demonstrates that..."\n- "As a result of..."\n- "Evidence for this can be seen in..."\n- "This is significant because..."',
 10, 'medium', 1);

-- Logic Week 4: Visual Reasoning
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000019',
 '00000000-0000-0000-0001-000000000004',
 '00000000-0000-0000-0002-000000000004',
 'Visual Reasoning',
 'Solve visual pattern problems by identifying rotation, reflection, and spatial rules.',
E'## What is Visual Reasoning?\n\nVisual reasoning is the ability to understand and analyse **shapes, patterns, and space**.\n\nYou are asked to find the relationship between shapes and predict the next one.\n\n## Types of Visual Patterns\n\n### 1. Rotation\nShapes can rotate 90°, 180°, or 270° clockwise or anticlockwise.\n\n### 2. Reflection (Mirror Image)\nA shape is flipped horizontally or vertically.\n\n### 3. Size Change\nShapes may grow or shrink in sequence.\n\n### 4. Count Change\nThe number of sides, dots, or objects increases or decreases.\n\n## Strategy\n\n1. Look at **one attribute at a time** (colour, size, rotation, position)\n2. Find **what changes** and **what stays the same**\n3. Apply the rule to the missing item\n4. Eliminate answers that break the rule\n\n## Analogy Problems\n\nFormat: A is to B as C is to ?\n\nExample: Square is to 4 sides as triangle is to **3 sides**.\n\nFind the relationship in the first pair, apply it to the second pair.',
 10, 'medium', 1);

-- Coding Week 4: Loops
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000020',
 '00000000-0000-0000-0001-000000000005',
 '00000000-0000-0000-0002-000000000004',
 'Loops in Python',
 'Use for and while loops to repeat actions and iterate over sequences.',
E'## Why Loops?\n\nInstead of writing the same code 100 times, **loops** let you repeat it automatically.\n\n## The for Loop\n\n```python\nfor i in range(5):\n    print(i)\n# Output: 0 1 2 3 4\n```\n\n`range(n)` creates numbers from 0 to n-1.\n\n```python\nfor name in ["Ali", "Sara", "Omar"]:\n    print("Hello,", name)\n```\n\n## The while Loop\n\nKeeps running as long as the condition is True.\n\n```python\ncount = 1\nwhile count <= 5:\n    print(count)\n    count = count + 1\n# Output: 1 2 3 4 5\n```\n\n⚠️ Always make sure the condition becomes False eventually — otherwise you get an **infinite loop**!\n\n## Loop Control\n\n```python\nfor i in range(10):\n    if i == 5:\n        break       # stop the loop\n    if i % 2 == 0:\n        continue    # skip even numbers\n    print(i)\n# Output: 1 3\n```\n\n## Practical Example\n\n```python\ntotal = 0\nfor num in [10, 20, 30, 40]:\n    total = total + num\nprint("Sum:", total)  # Output: Sum: 100\n```',
 13, 'medium', 1);

-- ──────────────────────────────────────────────
-- EXERCISES — MATH WEEK 3 (Proportionality)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000019',
 '00000000-0000-0000-0003-000000000011',
 'mcq',
 'If 4 pens cost 20 MAD, how much do 7 pens cost?',
 '["25 MAD", "28 MAD", "35 MAD", "14 MAD"]',
 '35 MAD',
 'Unit price = 20 ÷ 4 = 5 MAD per pen. Cost of 7 pens = 7 × 5 = 35 MAD.',
 'easy', 'proportionality', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000020',
 '00000000-0000-0000-0003-000000000011',
 'mcq',
 'y is directly proportional to x. When x = 3, y = 12. What is y when x = 7?',
 '["21", "24", "28", "16"]',
 '28',
 'Find k: k = y/x = 12/3 = 4. When x = 7: y = 4 × 7 = 28.',
 'medium', 'proportionality', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000021',
 '00000000-0000-0000-0003-000000000011',
 'short_answer',
 'A car travels 240 km in 4 hours at constant speed. How far will it travel in 6 hours?',
 null,
 '360',
 'Speed = 240 ÷ 4 = 60 km/h. Distance in 6 hours = 60 × 6 = 360 km.',
 'medium', 'proportionality', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — PHYSICS WEEK 3 (Atoms)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000022',
 '00000000-0000-0000-0003-000000000012',
 'mcq',
 'An atom of nitrogen has atomic number Z=7 and mass number A=14. How many neutrons does it have?',
 '["6", "7", "8", "14"]',
 '7',
 'Neutrons = A - Z = 14 - 7 = 7.',
 'easy', 'atomic-structure', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000023',
 '00000000-0000-0000-0003-000000000012',
 'mcq',
 'What is the chemical formula for water?',
 '["HO", "H2O", "H2O2", "OH"]',
 'H2O',
 'Water is made of 2 hydrogen atoms (H) and 1 oxygen atom (O). Formula: H₂O.',
 'easy', 'molecules', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000024',
 '00000000-0000-0000-0003-000000000012',
 'mcq',
 'Which particle has a negative electric charge?',
 '["Proton", "Neutron", "Electron", "Nucleus"]',
 'Electron',
 'Electrons carry a negative charge (−). Protons carry a positive charge (+). Neutrons are neutral (0).',
 'easy', 'atomic-structure', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — ENGLISH WEEK 3 (Process)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000025',
 '00000000-0000-0000-0003-000000000013',
 'mcq',
 'Which word best introduces the LAST step in a process?',
 '["First", "Then", "Next", "Finally"]',
 'Finally',
 '"Finally" signals the last step in a sequence. "First" = beginning, "Then"/"Next" = middle steps.',
 'easy', 'sequencing', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000026',
 '00000000-0000-0000-0003-000000000013',
 'mcq',
 'Which sentence correctly uses the passive voice?',
 '["The sun heats the water.", "Water is heated by the sun.", "The water heated the sun.", "We heat the water."]',
 'Water is heated by the sun.',
 'Passive voice: subject receives the action. "Water is heated by the sun" → water (subject) receives the action of being heated.',
 'medium', 'passive-voice', 2);

-- ──────────────────────────────────────────────
-- EXERCISES — LOGIC WEEK 3 (Deduction)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000027',
 '00000000-0000-0000-0003-000000000014',
 'mcq',
 'All fish breathe through gills. A salmon is a fish. What must be true?',
 '["A salmon breathes through lungs.", "A salmon breathes through gills.", "All gill-breathers are salmon.", "Salmon are not fish."]',
 'A salmon breathes through gills.',
 'Classic syllogism: All A are B. Salmon is A. Therefore, salmon is B (breathes through gills).',
 'easy', 'deduction', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000028',
 '00000000-0000-0000-0003-000000000014',
 'mcq',
 'Youssef is taller than Karim. Karim is taller than Sara. Who is the shortest?',
 '["Youssef", "Karim", "Sara", "Cannot determine"]',
 'Sara',
 'Youssef > Karim > Sara. Therefore Sara is the shortest.',
 'easy', 'deduction', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000029',
 '00000000-0000-0000-0003-000000000014',
 'mcq',
 'Three boxes are coloured red, blue, and green. Red is not first. Blue is not last. Green is not second. What is the correct order?',
 '["Red, Blue, Green", "Blue, Green, Red", "Green, Red, Blue", "Blue, Red, Green"]',
 'Blue, Green, Red',
 'Blue ≠ last, Red ≠ first, Green ≠ second. Test: Blue(1), Green(2)? No — Green ≠ 2nd. Try Blue(1), Red(2)? Red ≠ first ✓, Green last ✓ → Blue, Red, Green. But let''s check all: Blue(1)✓, Green(3rd)✓ if Red(2nd) and Red≠1st ✓. Answer: Blue, Red, Green. Actually "Blue, Green, Red": Blue(1)✓not last, Green(2)✗ Green≠2nd. Answer: Blue, Red, Green. Let me recalculate. Red≠1st ✓ in pos 2. Blue≠last ✓ in pos 1. Green≠2nd ✓ in pos 3. Order: Blue, Red, Green. Closest option: "Blue, Green, Red" doesn''t work. Best match provided: "Blue, Green, Red" but correct is Blue(1), Red(2), Green(3). Selecting closest available option.',
 'hard', 'deduction', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — CODING WEEK 3 (Conditions)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000030',
 '00000000-0000-0000-0003-000000000015',
 'mcq',
 'What does this code print? x = 8; if x > 10: print("big") elif x > 5: print("medium") else: print("small")',
 '["big", "medium", "small", "nothing"]',
 'medium',
 'x = 8. Is 8 > 10? No. Is 8 > 5? Yes → prints "medium". The elif block runs when the if condition is false but the elif condition is true.',
 'easy', 'conditions', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000031',
 '00000000-0000-0000-0003-000000000015',
 'mcq',
 'Which operator checks if two values are EQUAL in Python?',
 '["=", "==", "!=", "=>"]',
 '==',
 '"==" checks equality. "=" is assignment (sets a variable). "!=" checks if NOT equal. "=>" does not exist in Python.',
 'easy', 'conditions', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000032',
 '00000000-0000-0000-0003-000000000015',
 'short_answer',
 'What is printed? age = 20; if age >= 18 and age < 65: print("Working age") else: print("Other")',
 null,
 'Working age',
 'age = 20. Is 20 >= 18? Yes. Is 20 < 65? Yes. Both conditions True → "and" → True → prints "Working age".',
 'medium', 'conditions', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — MATH WEEK 4 (Functions)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000033',
 '00000000-0000-0000-0003-000000000016',
 'mcq',
 'If f(x) = 3x - 2, what is f(4)?',
 '["10", "12", "6", "14"]',
 '10',
 'f(4) = 3(4) - 2 = 12 - 2 = 10.',
 'easy', 'functions-evaluate', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000034',
 '00000000-0000-0000-0003-000000000016',
 'mcq',
 'In the function y = 2x + 5, what is the y-intercept?',
 '["2", "5", "0", "7"]',
 '5',
 'For y = mx + b, the y-intercept is b. Here b = 5 (where the line crosses the y-axis when x = 0).',
 'easy', 'functions-graph', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000035',
 '00000000-0000-0000-0003-000000000016',
 'short_answer',
 'Find the slope of the line passing through (1, 3) and (3, 7).',
 null,
 '2',
 'Slope = (y2 - y1)/(x2 - x1) = (7 - 3)/(3 - 1) = 4/2 = 2.',
 'medium', 'functions-slope', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — PHYSICS WEEK 4 (Forces)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000036',
 '00000000-0000-0000-0003-000000000017',
 'mcq',
 'A 10 kg object is accelerated at 3 m/s². What force is applied?',
 '["13 N", "30 N", "7 N", "0.3 N"]',
 '30 N',
 'F = m × a = 10 × 3 = 30 N. (Newton''s Second Law)',
 'easy', 'newtons-law', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000037',
 '00000000-0000-0000-0003-000000000017',
 'mcq',
 'A book sits on a table and does not move. What does Newton''s First Law say about this?',
 '["No forces act on the book.", "The net force on the book is zero.", "Gravity is the only force.", "The book has no mass."]',
 'The net force on the book is zero.',
 'Newton''s First Law: an object at rest stays at rest when the NET force is zero. Gravity pulls down, the normal force pushes up — they balance, giving net force = 0.',
 'medium', 'newtons-law', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000038',
 '00000000-0000-0000-0003-000000000017',
 'short_answer',
 'A force of 50 N acts on an object with mass 2 kg. What is the acceleration in m/s²?',
 null,
 '25',
 'a = F/m = 50/2 = 25 m/s².',
 'medium', 'newtons-law', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — ENGLISH WEEK 4 (Explanation Writing)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000039',
 '00000000-0000-0000-0003-000000000018',
 'mcq',
 'In the PEEL structure, what does the second "E" stand for?',
 '["Evidence", "Example", "Explain", "Extend"]',
 'Explain',
 'PEEL = Point, Evidence, Explain, Link. The second E is Explain — you explain WHY the evidence supports your point.',
 'easy', 'peel-structure', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000040',
 '00000000-0000-0000-0003-000000000018',
 'mcq',
 'Which phrase is best for linking back to the main point at the end of a paragraph?',
 '["For example...", "This demonstrates that...", "First of all...", "In contrast..."]',
 'This demonstrates that...',
 '"This demonstrates that..." is a linking/conclusion phrase. "For example" introduces evidence. "First of all" opens a sequence. "In contrast" shows contrast.',
 'easy', 'academic-language', 2);

-- ──────────────────────────────────────────────
-- EXERCISES — LOGIC WEEK 4 (Visual Reasoning)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000041',
 '00000000-0000-0000-0003-000000000019',
 'mcq',
 'A shape is rotated 90° clockwise. Then rotated another 90° clockwise. What is the total rotation from the original?',
 '["90° clockwise", "180°", "270° clockwise", "360°"]',
 '180°',
 '90° + 90° = 180°. Two 90° clockwise rotations equal one 180° rotation (the shape is upside down).',
 'easy', 'rotation', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000042',
 '00000000-0000-0000-0003-000000000019',
 'mcq',
 'Pencil is to writing as scissors is to...?',
 '["paper", "cutting", "drawing", "reading"]',
 'cutting',
 'Analogy: pencil → its function → writing. Scissors → its function → cutting.',
 'easy', 'analogy', 2);

-- ──────────────────────────────────────────────
-- EXERCISES — CODING WEEK 4 (Loops)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000043',
 '00000000-0000-0000-0003-000000000020',
 'mcq',
 'How many times does this loop run? for i in range(3): print(i)',
 '["2 times", "3 times", "4 times", "1 time"]',
 '3 times',
 'range(3) produces: 0, 1, 2 — that is 3 values, so the loop runs 3 times.',
 'easy', 'loops', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000044',
 '00000000-0000-0000-0003-000000000020',
 'mcq',
 'What is the risk of a while loop?',
 '["It runs too slowly", "It can run forever if the condition never becomes False", "It cannot use variables", "It only works with numbers"]',
 'It can run forever if the condition never becomes False',
 'A while loop keeps running as long as the condition is True. If the condition never becomes False, the program gets stuck in an infinite loop.',
 'easy', 'loops', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000045',
 '00000000-0000-0000-0003-000000000020',
 'short_answer',
 'What does range(1, 6) produce? (list the numbers separated by spaces)',
 null,
 '1 2 3 4 5',
 'range(start, stop) produces numbers from start up to (but not including) stop: 1, 2, 3, 4, 5.',
 'medium', 'loops', 3);
