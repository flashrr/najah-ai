-- ============================================================
-- Najah AI — Seed Data: 5 Subjects + 4 Weeks + Lessons + Exercises
-- ============================================================

-- ──────────────────────────────────────────────
-- SUBJECTS
-- ──────────────────────────────────────────────
insert into public.subjects (id, slug, name, description, icon, color) values
  ('00000000-0000-0000-0001-000000000001', 'math',    'Mathematics',         'Algebra, geometry, functions and problem solving', '📐', '#0ea5e9'),
  ('00000000-0000-0000-0001-000000000002', 'physics', 'Physics-Chemistry',   'Physical quantities, electricity, forces, reactions', '⚗️', '#8b5cf6'),
  ('00000000-0000-0000-0001-000000000003', 'english', 'English',             'Reading, writing, scientific vocabulary', '📖', '#10b981'),
  ('00000000-0000-0000-0001-000000000004', 'logic',   'Logic & IQ',          'Pattern recognition, deduction, visual reasoning', '🧩', '#f59e0b'),
  ('00000000-0000-0000-0001-000000000005', 'coding',  'Coding Basics',       'Introduction to programming concepts', '💻', '#ef4444');

-- ──────────────────────────────────────────────
-- WEEKS
-- ──────────────────────────────────────────────
insert into public.weeks (id, week_number, title, objective) values
  ('00000000-0000-0000-0002-000000000001', 1, 'Week 1 — Foundations',    'Build core skills: fractions, physical quantities, reading comprehension, patterns, intro to programming'),
  ('00000000-0000-0000-0002-000000000002', 2, 'Week 2 — Going Deeper',   'Simple equations, electricity basics, scientific vocabulary, number sequences, variables'),
  ('00000000-0000-0000-0002-000000000003', 3, 'Week 3 — Building Blocks','Proportionality, atoms & molecules, explaining processes, deduction puzzles, conditions'),
  ('00000000-0000-0000-0002-000000000004', 4, 'Week 4 — Expanding',      'Functions & graphs, forces & motion, writing explanations, visual reasoning, loops');

-- ──────────────────────────────────────────────
-- LESSONS — WEEK 1
-- ──────────────────────────────────────────────

-- Math Week 1
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000001',
 '00000000-0000-0000-0001-000000000001',
 '00000000-0000-0000-0002-000000000001',
 'Fractions and Operations',
 'Understand fractions, simplify them, and perform addition and subtraction.',
E'## What is a Fraction?\n\nA fraction represents a **part of a whole**. It is written as:\n\n$$\\frac{numerator}{denominator}$$\n\n- The **numerator** is how many parts you have.\n- The **denominator** is the total number of equal parts.\n\n### Example\n$$\\frac{3}{4}$$ means 3 out of 4 equal parts.\n\n## Simplifying Fractions\n\nDivide both numerator and denominator by their **Greatest Common Divisor (GCD)**.\n\n**Example:** Simplify $\\frac{6}{8}$\n- GCD(6, 8) = 2\n- $\\frac{6 \\div 2}{8 \\div 2} = \\frac{3}{4}$\n\n## Adding Fractions\n\nTo add fractions with the **same denominator**:\n$$\\frac{a}{c} + \\frac{b}{c} = \\frac{a+b}{c}$$\n\nTo add fractions with **different denominators**, find the LCD first.\n\n**Example:** $\\frac{1}{3} + \\frac{1}{4}$\n- LCD(3, 4) = 12\n- $\\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$\n\n## Quick Check\nBefore moving on, ask yourself:\n- Can I explain what a fraction represents?\n- Can I simplify a fraction on my own?\n- Can I add two fractions with different denominators?',
 12, 'easy', 1);

-- Physics Week 1
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000002',
 '00000000-0000-0000-0001-000000000002',
 '00000000-0000-0000-0002-000000000001',
 'Physical Quantities and Units',
 'Identify physical quantities, distinguish scalar from vector, and use SI units correctly.',
E'## What is a Physical Quantity?\n\nA **physical quantity** is anything we can measure.\n\nExamples: length, mass, temperature, speed, time.\n\n## SI Units\n\nScientists use the **International System of Units (SI)**:\n\n| Quantity    | SI Unit   | Symbol |\n|-------------|-----------|--------|\n| Length      | metre     | m      |\n| Mass        | kilogram  | kg     |\n| Time        | second    | s      |\n| Temperature | kelvin    | K      |\n| Current     | ampere    | A      |\n\n## Scalar vs Vector\n\n- **Scalar**: has only magnitude. Example: temperature (25°C), mass (5 kg)\n- **Vector**: has magnitude **and** direction. Example: velocity (10 m/s north), force\n\n## Unit Conversions\n\n**Example:** Convert 2.5 km to metres.\n- 1 km = 1000 m\n- 2.5 km = 2.5 × 1000 = **2500 m**\n\n## Remember\nAlways write the **unit** next to a value. "5" is meaningless — "5 kg" tells us something real.',
 10, 'easy', 1);

-- English Week 1
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000003',
 '00000000-0000-0000-0001-000000000003',
 '00000000-0000-0000-0002-000000000001',
 'Reading Comprehension — Science Text',
 'Identify the main idea, key facts, and vocabulary in a short scientific text.',
E'## Reading Strategy: PREVIEW → READ → REVIEW\n\n### Step 1 — Preview\nBefore reading, look at:\n- The title\n- Headings and subheadings\n- Any bold words\n\nAsk yourself: *What is this text probably about?*\n\n### Step 2 — Read\nRead carefully. For each paragraph, ask:\n- What is the main point?\n- What new words do I see?\n\n### Step 3 — Review\nAfter reading, ask:\n- What did I learn?\n- What can I summarise in one sentence?\n\n---\n\n## Practice Text\n\n**The Water Cycle**\n\nWater is constantly moving on Earth in a process called the **water cycle**. The sun heats water in oceans and lakes, causing it to **evaporate** — turning from liquid into water vapour (a gas). This vapour rises into the atmosphere, cools, and **condenses** into clouds. Eventually, water falls back to Earth as **precipitation** — rain, snow, or hail.\n\n---\n\n## Vocabulary\n\n| Word         | Meaning                          |\n|--------------|----------------------------------|\n| evaporate    | change from liquid to gas        |\n| condense     | change from gas to liquid        |\n| precipitation| water falling from clouds        |\n| atmosphere   | the layer of gases around Earth  |',
 12, 'easy', 1);

-- Logic Week 1
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000004',
 '00000000-0000-0000-0001-000000000004',
 '00000000-0000-0000-0002-000000000001',
 'Pattern Recognition',
 'Identify the rule in a sequence and predict the next element.',
E'## What is Pattern Recognition?\n\nPattern recognition is finding a **rule** that explains a sequence and using it to predict what comes next.\n\nThis skill is used in mathematics, science, coding, and problem-solving.\n\n## Types of Patterns\n\n### Number Patterns\nFind the rule between consecutive numbers.\n\n**Example:** 2, 4, 6, 8, ?\n- Rule: +2 each time\n- Answer: **10**\n\n**Example:** 3, 6, 12, 24, ?\n- Rule: ×2 each time\n- Answer: **48**\n\n### Shape Patterns\nLook at how shapes change: rotation, size, colour, number of sides.\n\n### Letter Patterns\n**Example:** A, C, E, G, ?\n- Rule: skip one letter each time\n- Answer: **I**\n\n## Strategy\n1. Look at the **difference** between terms.\n2. Check if it is **addition, subtraction, multiplication, or division**.\n3. Check for **alternating patterns** (even/odd terms follow different rules).\n4. State the rule clearly before answering.',
 10, 'easy', 1);

-- Coding Week 1
insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000005',
 '00000000-0000-0000-0001-000000000005',
 '00000000-0000-0000-0002-000000000001',
 'What is Programming?',
 'Understand what a program is, what a computer does with instructions, and write your first pseudocode.',
E'## What is Programming?\n\nA **program** is a set of instructions that tells a computer what to do.\n\nJust like a recipe tells you how to cook a meal — step by step — a program tells the computer exactly what to do, in order.\n\n## Why Learn to Code?\n\n- Computers do exactly what you tell them (nothing more, nothing less)\n- Programming lets you **automate** tasks, build apps, solve problems\n- It trains logical thinking\n\n## How Computers Think\n\nComputers follow **instructions** one at a time:\n1. Read the instruction\n2. Do it\n3. Move to the next instruction\n\n## Your First Pseudocode\n\n**Pseudocode** is writing program logic in plain language before coding it.\n\n```\nSTART\n  Display "Hello, my name is Youssef"\n  Display "I am learning to code"\nEND\n```\n\n## Key Vocabulary\n\n| Word         | Meaning                                      |\n|--------------|----------------------------------------------|\n| Program      | A set of instructions for a computer         |\n| Pseudocode   | Program logic written in plain language      |\n| Input        | Data the program receives                    |\n| Output       | Data the program produces                    |\n| Algorithm    | A step-by-step solution to a problem         |',
 10, 'easy', 1);

-- ──────────────────────────────────────────────
-- LESSONS — WEEK 2
-- ──────────────────────────────────────────────

insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000006',
 '00000000-0000-0000-0001-000000000001',
 '00000000-0000-0000-0002-000000000002',
 'Simple Equations',
 'Solve one-variable linear equations using balance method.',
E'## What is an Equation?\n\nAn equation says that two things are **equal**.\n\n$$2x + 3 = 11$$\n\nOur goal: find the value of **x** that makes this true.\n\n## The Balance Method\n\nThink of an equation as a **balance scale**. Whatever you do to one side, you must do to the other.\n\n**Example:** Solve $2x + 3 = 11$\n\n1. Subtract 3 from both sides: $2x = 8$\n2. Divide both sides by 2: $x = 4$\n\n**Check:** $2(4) + 3 = 8 + 3 = 11$ ✓\n\n## Common Steps\n\n1. Move all terms with **x** to one side\n2. Move all **numbers** to the other side\n3. Divide to find x\n4. **Always check** your answer by substituting back\n\n## Example 2\n\nSolve $5x - 7 = 3x + 9$\n\n1. $5x - 3x = 9 + 7$\n2. $2x = 16$\n3. $x = 8$',
 12, 'medium', 1);

insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000007',
 '00000000-0000-0000-0001-000000000002',
 '00000000-0000-0000-0002-000000000002',
 'Electricity Basics',
 'Understand electric current, voltage, and resistance. Apply Ohm''s Law.',
E'## Electric Current\n\n**Electric current** is the flow of electric charges (electrons) through a conductor.\n\n- Symbol: **I**\n- Unit: **Ampere (A)**\n\n## Voltage\n\n**Voltage** (or potential difference) is the force that pushes charges through a circuit.\n\n- Symbol: **U** or **V**\n- Unit: **Volt (V)**\n\n## Resistance\n\n**Resistance** is how much a material opposes the flow of current.\n\n- Symbol: **R**\n- Unit: **Ohm (Ω)**\n\n## Ohm''s Law\n\n$$U = R \\times I$$\n\nOr equivalently:\n- $I = \\frac{U}{R}$\n- $R = \\frac{U}{I}$\n\n## Example\n\nA resistor has R = 10 Ω and current I = 2 A flows through it.\nWhat is the voltage?\n\n$$U = R \\times I = 10 \\times 2 = 20 \\text{ V}$$',
 12, 'medium', 1);

insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000008',
 '00000000-0000-0000-0001-000000000003',
 '00000000-0000-0000-0002-000000000002',
 'Scientific Vocabulary',
 'Learn key scientific vocabulary in English and use it in context.',
E'## Why Scientific Vocabulary Matters\n\nScience uses **precise language**. Each word has an exact meaning. Learning these words helps you:\n- Understand science texts\n- Write clear explanations\n- Prepare for international exams\n\n## Core Scientific Terms\n\n| Word        | Definition                                | Example sentence                         |\n|-------------|-------------------------------------------|------------------------------------------|\n| hypothesis  | a testable prediction                     | "My hypothesis is that plants need light"|\n| observation | information gathered using the senses     | "I observed that the liquid turned red"  |\n| experiment  | a controlled test of a hypothesis         | "We conducted an experiment with heat"   |\n| variable    | something that can change in an experiment| "Temperature is the independent variable"|\n| evidence    | data supporting a conclusion              | "The evidence shows a clear pattern"     |\n| conclusion  | what the results tell us                  | "In conclusion, heat speeds up the reaction"|\n\n## Sentence Starters for Science Writing\n\n- "The results show that..."\n- "Based on the data, we can conclude..."\n- "The experiment demonstrates that..."\n- "One possible explanation is..."',
 10, 'easy', 1);

insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000009',
 '00000000-0000-0000-0001-000000000004',
 '00000000-0000-0000-0002-000000000002',
 'Number Sequences',
 'Identify arithmetic and geometric sequences and find missing terms.',
E'## Arithmetic Sequences\n\nIn an **arithmetic sequence**, the difference between consecutive terms is constant. This is called the **common difference (d)**.\n\n**Example:** 5, 8, 11, 14, ...\n- d = 3\n- Next term: 14 + 3 = **17**\n\n**Formula for the nth term:**\n$$a_n = a_1 + (n-1) \\times d$$\n\n## Geometric Sequences\n\nIn a **geometric sequence**, each term is multiplied by a constant **ratio (r)**.\n\n**Example:** 2, 6, 18, 54, ...\n- r = 3\n- Next term: 54 × 3 = **162**\n\n## Finding a Missing Term\n\n**Example:** 3, __, 27, 81\n- This is geometric: 3 × r × r = 27 → r² = 9 → r = 3\n- Missing term: 3 × 3 = **9**\n\n## Mixed Strategy\n1. Check if differences are equal → arithmetic\n2. Check if ratios are equal → geometric\n3. Look for alternating patterns\n4. Write the rule clearly',
 12, 'medium', 1);

insert into public.lessons (id, subject_id, week_id, title, objective, content_md, estimated_minutes, difficulty, order_index) values
('00000000-0000-0000-0003-000000000010',
 '00000000-0000-0000-0001-000000000005',
 '00000000-0000-0000-0002-000000000002',
 'Variables in Programming',
 'Understand what a variable is, how to declare and use one in Python.',
E'## What is a Variable?\n\nA **variable** is a named storage location in memory that holds a value.\n\nThink of it as a **labelled box**: you give the box a name, and you can put things in it or take them out.\n\n## Variables in Python\n\n```python\n# Creating a variable\nname = "Youssef"\nage = 15\nscore = 87.5\n\n# Using a variable\nprint(name)   # Output: Youssef\nprint(age)    # Output: 15\n```\n\n## Variable Naming Rules\n\n- Use letters, numbers, underscores\n- Cannot start with a number\n- Cannot use spaces (use `_` instead)\n- Names are case-sensitive (`Name` ≠ `name`)\n\n## Data Types\n\n| Type    | Example        | What it stores     |\n|---------|---------------|--------------------|\n| int     | `age = 15`    | whole numbers      |\n| float   | `score = 8.5` | decimal numbers    |\n| str     | `name = "Ali"`| text               |\n| bool    | `pass = True` | True or False      |\n\n## Update a Variable\n\n```python\nscore = 80\nscore = score + 10  # score is now 90\nprint(score)        # Output: 90\n```',
 12, 'easy', 1);

-- ──────────────────────────────────────────────
-- EXERCISES — MATH WEEK 1 (Fractions)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000001',
 '00000000-0000-0000-0003-000000000001',
 'mcq',
 'Which fraction is equivalent to 2/4?',
 '["1/2", "1/3", "2/3", "3/4"]',
 '1/2',
 'To simplify 2/4, divide both numerator and denominator by their GCD, which is 2: 2÷2 = 1, 4÷2 = 2. So 2/4 = 1/2.',
 'easy', 'fractions-simplify', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000002',
 '00000000-0000-0000-0003-000000000001',
 'mcq',
 'What is 1/3 + 1/6?',
 '["2/9", "1/2", "2/6", "1/3"]',
 '1/2',
 'LCD(3, 6) = 6. Convert: 1/3 = 2/6. Now add: 2/6 + 1/6 = 3/6. Simplify: 3/6 = 1/2.',
 'medium', 'fractions-add', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000003',
 '00000000-0000-0000-0003-000000000001',
 'mcq',
 'Simplify 12/18 to its lowest terms.',
 '["2/3", "4/6", "6/9", "1/2"]',
 '2/3',
 'GCD(12, 18) = 6. Divide both by 6: 12÷6 = 2, 18÷6 = 3. Result: 2/3.',
 'easy', 'fractions-simplify', 3);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000004',
 '00000000-0000-0000-0003-000000000001',
 'short_answer',
 'Calculate 3/4 - 1/8. Write your answer as a simplified fraction.',
 null,
 '5/8',
 'LCD(4, 8) = 8. Convert: 3/4 = 6/8. Subtract: 6/8 - 1/8 = 5/8. This is already simplified.',
 'medium', 'fractions-subtract', 4);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000005',
 '00000000-0000-0000-0003-000000000001',
 'mcq',
 'A pizza is cut into 8 equal slices. You eat 3 slices and your friend eats 2 slices. What fraction of the pizza is left?',
 '["3/8", "5/8", "2/8", "1/2"]',
 '3/8',
 'Total eaten: 3 + 2 = 5 slices out of 8. Left: 8 - 5 = 3 slices. Fraction left: 3/8.',
 'easy', 'fractions-real-world', 5);

-- ──────────────────────────────────────────────
-- EXERCISES — PHYSICS WEEK 1 (Units)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000006',
 '00000000-0000-0000-0003-000000000002',
 'mcq',
 'What is the SI unit of mass?',
 '["gram", "kilogram", "tonne", "pound"]',
 'kilogram',
 'The SI unit of mass is the kilogram (kg). The gram is 1/1000 of a kilogram and is used informally, but kilogram is the official SI base unit.',
 'easy', 'si-units', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000007',
 '00000000-0000-0000-0003-000000000002',
 'mcq',
 'Temperature is an example of a...',
 '["vector quantity", "scalar quantity", "derived unit", "force"]',
 'scalar quantity',
 'Temperature has only magnitude (e.g., 25°C), no direction. Therefore it is a scalar quantity.',
 'easy', 'scalar-vector', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000008',
 '00000000-0000-0000-0003-000000000002',
 'short_answer',
 'Convert 3.5 km to metres.',
 null,
 '3500',
 '1 km = 1000 m. So 3.5 km = 3.5 × 1000 = 3500 m.',
 'easy', 'unit-conversion', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — ENGLISH WEEK 1 (Reading)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000009',
 '00000000-0000-0000-0003-000000000003',
 'mcq',
 'In the water cycle passage, what happens after water vapour rises into the atmosphere?',
 '["It evaporates", "It condenses into clouds", "It falls as snow immediately", "It becomes liquid in the ocean"]',
 'It condenses into clouds',
 'The text says: "This vapour rises into the atmosphere, cools, and condenses into clouds." Condensation happens before precipitation.',
 'easy', 'reading-comprehension', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000010',
 '00000000-0000-0000-0003-000000000003',
 'mcq',
 'What does "evaporate" mean?',
 '["fall from clouds", "change from liquid to gas", "change from gas to liquid", "form clouds"]',
 'change from liquid to gas',
 'The vocabulary table defines evaporate as "change from liquid to gas". When water is heated, it turns into water vapour (a gas).',
 'easy', 'vocabulary', 2);

-- ──────────────────────────────────────────────
-- EXERCISES — LOGIC WEEK 1 (Patterns)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000011',
 '00000000-0000-0000-0003-000000000004',
 'mcq',
 'What comes next in the sequence: 1, 4, 9, 16, ?',
 '["20", "25", "24", "18"]',
 '25',
 'This is a sequence of perfect squares: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25. The rule is n².',
 'medium', 'pattern-squares', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000012',
 '00000000-0000-0000-0003-000000000004',
 'mcq',
 'What comes next: A, D, G, J, ?',
 '["K", "L", "M", "N"]',
 'M',
 'Each letter skips 2 letters: A → (B, C) → D → (E, F) → G → (H, I) → J → (K, L) → M. The pattern is +3 positions.',
 'medium', 'pattern-letters', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000013',
 '00000000-0000-0000-0003-000000000004',
 'short_answer',
 'Find the next number: 2, 6, 18, 54, ?',
 null,
 '162',
 'This is a geometric sequence. Each term is multiplied by 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162.',
 'medium', 'pattern-geometric', 3);

-- ──────────────────────────────────────────────
-- EXERCISES — CODING WEEK 1 (Intro)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000014',
 '00000000-0000-0000-0003-000000000005',
 'mcq',
 'What is a program?',
 '["A type of computer hardware", "A set of instructions that tells a computer what to do", "A programming language", "A type of virus"]',
 'A set of instructions that tells a computer what to do',
 'A program is a set of step-by-step instructions that the computer follows to perform a task. Like a recipe for cooking.',
 'easy', 'programming-concepts', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000015',
 '00000000-0000-0000-0003-000000000005',
 'mcq',
 'What is pseudocode?',
 '["A programming error", "Program logic written in plain language", "A type of Python code", "Machine language"]',
 'Program logic written in plain language',
 'Pseudocode is a way to write the steps of a program in plain human language, before writing actual code. It helps plan the solution.',
 'easy', 'programming-concepts', 2);

-- ──────────────────────────────────────────────
-- EXERCISES — MATH WEEK 2 (Equations)
-- ──────────────────────────────────────────────

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000016',
 '00000000-0000-0000-0003-000000000006',
 'mcq',
 'Solve: x + 7 = 12',
 '["x = 5", "x = 4", "x = 19", "x = 6"]',
 'x = 5',
 'Subtract 7 from both sides: x = 12 - 7 = 5. Check: 5 + 7 = 12 ✓',
 'easy', 'equations-solve', 1);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000017',
 '00000000-0000-0000-0003-000000000006',
 'short_answer',
 'Solve: 3x - 4 = 11. What is x?',
 null,
 '5',
 'Add 4 to both sides: 3x = 15. Divide both sides by 3: x = 5. Check: 3(5) - 4 = 15 - 4 = 11 ✓',
 'medium', 'equations-solve', 2);

insert into public.exercises (id, lesson_id, type, question, options, correct_answer, explanation, difficulty, skill_tag, order_index) values
('00000000-0000-0000-0004-000000000018',
 '00000000-0000-0000-0003-000000000006',
 'mcq',
 'Solve: 2x + 5 = 3x - 1',
 '["x = 6", "x = 4", "x = 8", "x = 3"]',
 'x = 6',
 'Move x terms: 2x - 3x = -1 - 5 → -x = -6 → x = 6. Check: 2(6)+5=17, 3(6)-1=17 ✓',
 'hard', 'equations-two-sides', 3);
