import {
  AiUseCase,
  CourseStatus,
  EventType,
  ExamType,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const runtime = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function loadLocalEnv() {
  const envPaths = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];

  for (const envPath of envPaths) {
    if (!existsSync(envPath)) {
      continue;
    }

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");

      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

      const runtimeEnv = runtime.process?.["env"];

      if (runtimeEnv) {
        runtimeEnv[key] = value;
      }
    }
  }
}

loadLocalEnv();

const prisma = new PrismaClient();

const examTargets = [
  {
    type: ExamType.IBA,
    name: "Institute of Business Administration",
    description: "English, quantitative, and analytical preparation for IBA DU admission.",
    subjects: {
      English: ["RC", "Vocabulary", "Grammar", "Sentence Correction"],
      Quantitative: ["Percentage", "Profit Loss", "Ratio", "Time Work", "Speed Distance"],
      Analytical: ["Critical Reasoning", "Data Sufficiency", "Logical Deduction"],
    },
  },
  {
    type: ExamType.MEDICAL,
    name: "MBBS Admission",
    description: "Medical admission preparation aligned with HSC science fundamentals.",
    subjects: {
      Biology: ["Cell", "Genetics", "Ecology", "Human Physiology", "Plant Biology"],
      English: ["Grammar", "Vocabulary", "Comprehension"],
    },
  },
  {
    type: ExamType.B_UNIT,
    name: "DU Humanities",
    description: "Dhaka University B Unit humanities admission preparation.",
    subjects: {
      Bangla: ["Grammar", "Literature"],
      English: ["Grammar", "Comprehension"],
      "General Knowledge": ["Bangladesh Affairs", "World Affairs"],
    },
  },
  {
    type: ExamType.C_UNIT,
    name: "DU Business",
    description: "Dhaka University C Unit business admission preparation.",
    subjects: {
      Accounting: ["Financial Statements", "Journal"],
      English: ["Grammar", "Vocabulary"],
      Bangla: ["Grammar", "Comprehension"],
    },
  },
  {
    type: ExamType.D_UNIT,
    name: "DU Fine Arts",
    description: "Dhaka University D Unit fine arts admission preparation.",
    subjects: {
      Drawing: ["Composition", "Perspective"],
      "General Knowledge": ["Culture", "Art History"],
      Bangla: ["Grammar", "Literature"],
    },
  },
] as const;

const promptSeeds = [
  {
    useCase: AiUseCase.WRONG_ANSWER_EXPLANATION,
    version: 1,
    title: "Wrong answer explanation",
    body: "Explain why the selected answer is wrong and why the correct answer is right. Use 3-4 simple sentences for a Bangladeshi HSC student.",
  },
  {
    useCase: AiUseCase.FEYNMAN_GAP_DETECTION,
    version: 1,
    title: "Feynman gap detection",
    body: "Score whether the student can explain the concept simply, identify missing ideas, and give concise Bangla-English feedback.",
  },
  {
    useCase: AiUseCase.SOCRATIC_CHAIN,
    version: 1,
    title: "Socratic chain",
    body: "Ask five progressive reasoning questions: existence, mechanism, failure, tradeoff, and boundary condition.",
  },
  {
    useCase: AiUseCase.FIRST_PRINCIPLES,
    version: 1,
    title: "First principles explanation",
    body: "Check whether the student reconstructs a claim from atomic truths before using formulas.",
  },
];

type QuestionSeed = readonly [
  text: string,
  options: readonly string[],
  correctIndex: number,
  explanation: string,
];

type QuestionTemplateMap = Record<string, readonly QuestionSeed[]>;

const englishTemplates: QuestionTemplateMap = {
  RC: [
    ["The passage implies that active recall is effective because it forces students to:", ["avoid reading", "retrieve ideas from memory", "skip revision", "memorize blindly"], 1, "Active recall works because it asks the learner to retrieve an idea without looking. This strengthens memory more than passive reading."],
    ["The author's tone toward rote memorization is best described as:", ["supportive", "critical", "uncertain", "celebratory"], 1, "The passage warns that rote learning creates an illusion of competence. That makes the tone critical."],
    ["Which statement is most consistent with deep learning?", ["Repeat notes silently", "Explain a rule in simple words", "Highlight every page", "Avoid difficult questions"], 1, "Deep learning requires the student to rebuild the idea. Explaining in simple words proves understanding."],
    ["The main purpose of a diagnostic test is to:", ["increase screen time", "find weak areas", "replace teachers", "hide mistakes"], 1, "A diagnostic test is useful because it reveals where the learner is weak. It guides the next practice session."],
    ["The phrase 'illusion of competence' means:", ["real mastery", "false confidence", "low motivation", "high accuracy"], 1, "Illusion of competence means the student feels ready but cannot solve new problems. It is false confidence."],
    ["A student who can apply a concept to a new example has likely achieved:", ["surface recall", "conceptual transfer", "random guessing", "passive exposure"], 1, "Applying a concept in a new context shows transfer. This is stronger than memorizing the same example."],
    ["The passage suggests feedback should be:", ["late and vague", "instant and specific", "hidden", "only numerical"], 1, "Useful feedback tells the student exactly what went wrong. It should arrive while the mistake is fresh."],
    ["Which action best reduces passive learning?", ["watching long lectures only", "typing an explanation", "copying examples", "reading summaries twice"], 1, "Typing an explanation creates active friction. It makes the student retrieve and organize ideas."],
    ["The author's central claim is that preparation should build:", ["speed only", "understanding and adaptation", "luck", "test anxiety"], 1, "The passage values preparation that helps students adapt to novel questions. Understanding is the core."],
    ["In the context of learning, 'friction' is useful when it:", ["blocks all progress", "forces meaningful effort", "confuses students forever", "removes feedback"], 1, "Desirable friction makes learners think harder in a productive way. That effort improves retention."],
  ],
  Vocabulary: [
    ["Choose the closest meaning of 'ephemeral'.", ["permanent", "short-lived", "ancient", "powerful"], 1, "Ephemeral means lasting for a very short time. A temporary social media story is an easy example."],
    ["Choose the closest meaning of 'meticulous'.", ["careless", "very careful", "angry", "ordinary"], 1, "Meticulous means extremely careful about details. It is the opposite of careless."],
    ["Choose the closest meaning of 'ambiguous'.", ["clear", "uncertain in meaning", "fast", "harmful"], 1, "Ambiguous means having more than one possible meaning. The meaning is not fully clear."],
    ["Choose the closest meaning of 'resilient'.", ["able to recover", "easily broken", "silent", "expensive"], 0, "Resilient means able to recover after difficulty. It describes mental strength or flexible materials."],
    ["Choose the antonym of 'scarce'.", ["rare", "abundant", "limited", "missing"], 1, "Scarce means not enough. Its opposite is abundant, meaning more than enough."],
    ["Choose the closest meaning of 'coherent'.", ["logical and connected", "random", "hidden", "weak"], 0, "Coherent means the parts fit together logically. A coherent answer is easy to follow."],
    ["Choose the closest meaning of 'scrutinize'.", ["ignore", "examine carefully", "celebrate", "delay"], 1, "To scrutinize means to inspect very carefully. It is stronger than just looking."],
    ["Choose the closest meaning of 'pragmatic'.", ["practical", "emotional", "ancient", "theoretical only"], 0, "Pragmatic means practical and realistic. It focuses on what works."],
    ["Choose the closest meaning of 'inevitable'.", ["avoidable", "certain to happen", "rare", "minor"], 1, "Inevitable means certain to happen. It cannot be avoided."],
    ["Choose the closest meaning of 'concise'.", ["brief and clear", "very long", "confusing", "incorrect"], 0, "Concise means short but clear. It removes unnecessary words."],
  ],
  Grammar: [
    ["Choose the correct sentence.", ["He don't know the answer.", "He doesn't know the answer.", "He doesn't knows the answer.", "He do not know the answer."], 1, "With he, she, or it, use does not or doesn't. After does, the main verb stays in base form: know."],
    ["Choose the correct sentence.", ["She go to class daily.", "She goes to class daily.", "She going to class daily.", "She gone to class daily."], 1, "For third person singular in present simple, add s or es to the verb. Therefore, 'She goes' is correct."],
    ["Choose the correct preposition.", ["interested on", "interested in", "interested at", "interested for"], 1, "The correct phrase is 'interested in'. Preposition collocations must be learned as fixed patterns."],
    ["Choose the correct form.", ["Neither of the answers are correct.", "Neither of the answers is correct.", "Neither of the answers were correct.", "Neither of the answers have correct."], 1, "Neither is singular in formal grammar. So it takes 'is'."],
    ["Choose the correct sentence.", ["I have seen him yesterday.", "I saw him yesterday.", "I had saw him yesterday.", "I see him yesterday."], 1, "A finished past time like yesterday uses simple past. So 'I saw him yesterday' is correct."],
    ["Choose the correct article.", ["He is a honest man.", "He is an honest man.", "He is the honest man.", "He is honest a man."], 1, "Honest starts with a vowel sound because h is silent. Therefore, use 'an'."],
    ["Choose the correct form.", ["The data is reliable.", "The data are reliable.", "The data were reliable only.", "The data be reliable."], 1, "In formal academic English, data is plural. 'The data are reliable' is the preferred answer."],
    ["Choose the correct sentence.", ["If I was you, I would study.", "If I were you, I would study.", "If I am you, I would study.", "If I be you, I study."], 1, "Hypothetical condition uses 'were' with all subjects. 'If I were you' is standard."],
    ["Choose the correct form.", ["Each students has a book.", "Each student has a book.", "Each student have a book.", "Each students have a book."], 1, "Each is singular. Use 'student' and 'has'."],
    ["Choose the correct sentence.", ["He is senior than me.", "He is senior to me.", "He is senior from me.", "He is senior over me."], 1, "Senior takes the preposition 'to', not than. This is a fixed comparative pattern."],
  ],
  "Sentence Correction": [
    ["Correct the sentence: 'The reason is because he was late.'", ["The reason is that he was late.", "The reason because he late.", "The reason is he late.", "The reason was because late."], 0, "Use 'the reason is that' instead of 'the reason is because'. This avoids redundancy."],
    ["Correct the sentence: 'Despite of rain, we played.'", ["Despite rain, we played.", "Despite of the rain, we played.", "Despite raining of, we played.", "Despite to rain, we played."], 0, "Despite is not followed by 'of'. Use 'despite rain' or 'in spite of rain'."],
    ["Correct the sentence: 'He discussed about the issue.'", ["He discussed the issue.", "He discussed about issue.", "He discussed on the issue.", "He discussed for the issue."], 0, "Discuss is a transitive verb and does not take 'about' directly after it."],
    ["Correct the sentence: 'She is good in English.'", ["She is good at English.", "She is good on English.", "She is good by English.", "She is good for English."], 0, "The correct collocation is 'good at'. Use 'good at English'."],
    ["Correct the sentence: 'One of my friend is here.'", ["One of my friends is here.", "One of my friend are here.", "One my friends is here.", "One of my friends are here."], 0, "After 'one of', the noun is plural. The verb agrees with one, so 'is' remains singular."],
    ["Correct the sentence: 'He prefers tea than coffee.'", ["He prefers tea to coffee.", "He prefers tea than coffee.", "He prefers tea over than coffee.", "He prefers tea from coffee."], 0, "Prefer takes 'to' when comparing two choices. Use 'prefers tea to coffee'."],
    ["Correct the sentence: 'No sooner he arrived than it rained.'", ["No sooner had he arrived than it rained.", "No sooner he arrived then it rained.", "No sooner did he arrived than it rained.", "No sooner had he arrive than it rained."], 0, "No sooner requires inversion with had. The correct structure is 'No sooner had he arrived than...'."],
    ["Correct the sentence: 'The news are shocking.'", ["The news is shocking.", "The news are shocking.", "The news were shocking are.", "The news have shocking."], 0, "News is singular in English. Use 'The news is shocking'."],
    ["Correct the sentence: 'I look forward to meet you.'", ["I look forward to meeting you.", "I look forward to meet you.", "I look forward meeting you.", "I look forward to met you."], 0, "After 'look forward to', use a gerund. So 'meeting' is correct."],
    ["Correct the sentence: 'He has been working since two hours.'", ["He has been working for two hours.", "He has been working since two hours.", "He has working for two hours.", "He works since two hours."], 0, "Use 'for' with duration and 'since' with starting point. Two hours is a duration."],
  ],
};

const quantitativeTemplates: QuestionTemplateMap = {
  Percentage: [
    ["What is 20% of 250?", ["25", "50", "75", "100"], 1, "20% means 20 out of 100. So 250 × 20/100 = 50."],
    ["A number is increased from 80 to 100. What is the percentage increase?", ["20%", "25%", "30%", "40%"], 1, "Increase is 20. Percentage increase is 20/80 × 100 = 25%."],
    ["If 30% of x is 45, what is x?", ["120", "135", "150", "180"], 2, "30% of x = 45 means 0.3x = 45. So x = 150."],
    ["A price decreases by 10% from 500. New price?", ["450", "455", "490", "550"], 0, "10% of 500 is 50. New price is 500 - 50 = 450."],
    ["What percent is 18 of 60?", ["20%", "25%", "30%", "35%"], 2, "18/60 × 100 = 30%. The base is 60."],
    ["If 40% students passed and 120 failed out of 200, how many passed?", ["60", "70", "80", "90"], 2, "40% of 200 = 80. The failed count is extra information."],
    ["A value becomes 132 after 10% increase. Original value?", ["110", "120", "125", "122"], 1, "After 10% increase, value is 110% of original. Original = 132/1.1 = 120."],
    ["What is 12.5% of 160?", ["10", "15", "20", "25"], 2, "12.5% is 1/8. One-eighth of 160 is 20."],
    ["If A is 25% more than B and B=80, A=?", ["90", "95", "100", "105"], 2, "25% of 80 is 20. A = 80 + 20 = 100."],
    ["A score rises from 60 to 75. Percentage rise?", ["15%", "20%", "25%", "30%"], 2, "Increase is 15. Percentage rise is 15/60 × 100 = 25%."],
  ],
  "Profit Loss": [
    ["A shopkeeper buys at ৳80 and sells at ৳100. Profit percentage?", ["20%", "25%", "30%", "15%"], 1, "Profit is 20. Profit percentage is 20/80 × 100 = 25%."],
    ["Cost price is 500 and loss is 10%. Selling price?", ["450", "470", "500", "550"], 0, "10% loss means selling at 90% of cost. 500 × 0.9 = 450."],
    ["Selling price is 240, profit is 20%. Cost price?", ["180", "200", "220", "230"], 1, "SP is 120% of CP. CP = 240/1.2 = 200."],
    ["Cost is 120 and selling price is 150. Profit?", ["20", "25", "30", "35"], 2, "Profit equals selling price minus cost price. 150 - 120 = 30."],
    ["Marked price is 1000, discount 15%. Selling price?", ["750", "800", "850", "900"], 2, "15% of 1000 is 150. Selling price is 1000 - 150 = 850."],
    ["A trader gains 25% by selling at 625. Cost price?", ["450", "500", "525", "550"], 1, "625 is 125% of cost. Cost = 625/1.25 = 500."],
    ["Loss is 20% on cost price 300. Selling price?", ["220", "230", "240", "250"], 2, "20% loss means 80% of 300. That is 240."],
    ["If profit is 40 on cost 160, profit percentage?", ["20%", "25%", "30%", "40%"], 1, "Profit percentage is 40/160 × 100 = 25%."],
    ["A product sold at 10% profit for 220. Cost price?", ["180", "190", "200", "210"], 2, "220 is 110% of cost. Cost = 220/1.1 = 200."],
    ["A seller gives 20% discount on 500. Discount amount?", ["50", "75", "100", "125"], 2, "20% of 500 is 100. That is the discount amount."],
  ],
  Ratio: [
    ["Simplify the ratio 12:18.", ["2:3", "3:2", "4:5", "6:9"], 0, "Divide both terms by 6. The simplified ratio is 2:3."],
    ["If A:B = 2:3 and B=30, A=?", ["15", "20", "25", "30"], 1, "3 parts equal 30, so 1 part equals 10. A is 2 parts, so A=20."],
    ["Divide 100 in the ratio 2:3.", ["30 and 70", "40 and 60", "50 and 50", "20 and 80"], 1, "Total parts are 5. Shares are 2/5×100=40 and 3/5×100=60."],
    ["If x:y = 4:5 and x=28, y=?", ["30", "32", "35", "40"], 2, "4 parts equal 28, so 1 part is 7. y is 5 parts, so y=35."],
    ["Ratio 3:7 has total 50. Smaller part?", ["10", "15", "20", "25"], 1, "Total parts are 10. One part is 5, so smaller part is 3×5 = 15."],
    ["A:B:C = 1:2:3 and total is 60. C=?", ["20", "25", "30", "35"], 2, "Total parts are 6. One part is 10, so C is 3×10 = 30."],
    ["If boys:girls = 5:4 and total is 45, girls?", ["18", "20", "25", "27"], 1, "Total parts are 9. One part is 5. Girls are 4×5 = 20. So option B is correct."],
    ["Equivalent ratio of 6:8 is:", ["3:4", "4:3", "2:5", "8:6"], 0, "Divide both sides by 2. 6:8 becomes 3:4."],
    ["If A:B = 7:2 and A-B=25, A=?", ["30", "35", "40", "45"], 1, "Difference is 5 parts. 5 parts = 25, so 1 part = 5. A=7×5=35."],
    ["Two numbers are in ratio 3:5 and sum 64. Larger number?", ["32", "36", "40", "45"], 2, "Total parts are 8. One part is 8, so larger number is 5×8 = 40."],
  ],
  "Time Work": [
    ["A can finish a work in 10 days. Work done in 1 day?", ["1/5", "1/10", "1/20", "10"], 1, "If total work is 1, A completes 1/10 per day."],
    ["A finishes in 6 days, B in 3 days. Together per day?", ["1/2", "1/3", "2/3", "1"], 0, "A does 1/6 and B does 1/3 per day. Together = 1/6+1/3 = 1/2."],
    ["If 4 workers finish in 5 days, 2 workers finish in?", ["5 days", "10 days", "12 days", "20 days"], 1, "Workers and time are inversely proportional. Half workers need double time, so 10 days."],
    ["A does 1/4 work per day. Days needed?", ["2", "3", "4", "5"], 2, "If 1/4 is done daily, full work takes 4 days."],
    ["A and B together finish in 8 days. Their one-day work?", ["1/4", "1/6", "1/8", "1/10"], 2, "Together they complete 1/8 of the work per day."],
    ["A takes 12 days, B takes 12 days. Together?", ["4 days", "5 days", "6 days", "8 days"], 2, "Together work per day is 1/12+1/12=1/6. So they finish in 6 days."],
    ["If 3 machines make 300 units in 5 hours, 1 machine makes per hour?", ["10", "15", "20", "25"], 2, "Total machine-hours = 3×5 = 15. 300/15 = 20 units per machine-hour."],
    ["A can do work in 15 days. After 5 days, work left?", ["1/3", "1/2", "2/3", "3/4"], 2, "A completes 5/15 = 1/3. Work left is 2/3."],
    ["Pipe fills tank in 4 hours. Part filled in 1 hour?", ["1/2", "1/3", "1/4", "1/5"], 2, "Rate is one tank divided by 4 hours, so 1/4 tank per hour."],
    ["A does half work in 6 days. Full work in?", ["8", "10", "12", "14"], 2, "If half takes 6 days, full work takes 12 days at the same rate."],
  ],
  "Speed Distance": [
    ["A train travels 120 km in 2 hours. Speed in km/h?", ["40", "50", "60", "70"], 2, "Speed = distance/time = 120/2 = 60 km/h."],
    ["Convert 72 km/h to m/s.", ["10", "15", "20", "25"], 2, "Multiply by 5/18. 72×5/18 = 20 m/s."],
    ["A car travels 150 km at 50 km/h. Time?", ["2 h", "2.5 h", "3 h", "3.5 h"], 2, "Time = distance/speed = 150/50 = 3 hours."],
    ["Speed 10 m/s for 60 seconds gives distance:", ["500 m", "600 m", "700 m", "1000 m"], 1, "Distance = speed × time = 10×60 = 600 m."],
    ["If speed doubles, time for same distance becomes:", ["double", "half", "same", "zero"], 1, "For fixed distance, speed and time are inversely proportional. Double speed means half time."],
    ["A person walks 5 km in 1 hour 15 minutes. Speed?", ["3 km/h", "4 km/h", "5 km/h", "6 km/h"], 1, "1 hour 15 minutes is 1.25 hours. Speed = 5/1.25 = 4 km/h."],
    ["Distance is 90 km, time is 1.5 hours. Speed?", ["45", "60", "75", "90"], 1, "Speed = 90/1.5 = 60 km/h."],
    ["A train speed is 54 km/h. In m/s?", ["10", "12", "15", "18"], 2, "54×5/18 = 15 m/s."],
    ["At 30 km/h, distance in 20 minutes?", ["5 km", "10 km", "15 km", "20 km"], 1, "20 minutes is 1/3 hour. Distance = 30×1/3 = 10 km."],
    ["If distance is doubled and speed is doubled, time becomes:", ["same", "double", "half", "four times"], 0, "Time = distance/speed. Doubling both keeps the ratio same."],
  ],
};

const computerScienceTemplates: QuestionTemplateMap = {
  "Greedy Algorithms": [
    [
      "What is the main idea of a greedy algorithm?",
      [
        "Try every possible solution before choosing",
        "Choose the best-looking local option at each step",
        "Always use recursion to split the problem",
        "Store every subproblem answer in a table",
      ],
      1,
      "A greedy algorithm makes the best local choice available right now. It works only when those local choices also lead to a globally optimal answer.",
    ],
    [
      "When is a greedy strategy most likely to be correct?",
      [
        "When every local best choice can safely be part of an optimal solution",
        "When the input size is very small",
        "When the problem has no constraints",
        "When the answer must be found by random guessing",
      ],
      0,
      "Greedy works when the problem has the greedy-choice property. That means choosing the best local option does not block the best final solution.",
    ],
    [
      "Why can the greedy coin-change method fail for some coin systems?",
      [
        "Because it always sorts coins from smallest to largest",
        "Because it may pick a large coin that prevents the fewest total coins",
        "Because coin-change problems never have optimal answers",
        "Because greedy algorithms cannot use loops",
      ],
      1,
      "Greedy coin change picks the largest coin first. In some custom coin systems, that first large choice can force more coins than a different smaller first choice.",
    ],
    [
      "In the activity selection problem, which greedy choice is usually used?",
      [
        "Pick the activity with the longest duration first",
        "Pick the activity with the earliest start time first",
        "Pick the activity that finishes earliest first",
        "Pick activities in random order",
      ],
      2,
      "The classic activity selection greedy rule picks the activity that finishes earliest. Finishing early leaves the most remaining time for future compatible activities.",
    ],
    [
      "What is the greedy idea behind Huffman coding?",
      [
        "Combine the two least frequent symbols first",
        "Give every symbol the same length code",
        "Put the most frequent symbol deepest in the tree",
        "Ignore frequency and sort alphabetically",
      ],
      0,
      "Huffman coding repeatedly combines the two least frequent symbols. This keeps frequent symbols closer to the root, giving them shorter codes.",
    ],
  ],
};

const events = [
  {
    slug: "bdmo-logic-sprint",
    title: "BDMO Logic Sprint",
    type: EventType.OLYMPIAD,
    description: "Free 45-minute contest covering binary, parity, and proof puzzles.",
    startsAt: new Date("2026-06-12T15:00:00.000Z"),
    venue: "Online",
    price: 0,
    capacity: 500,
  },
  {
    slug: "ict-crash-workshop",
    title: "ICT Crash Workshop",
    type: EventType.WORKSHOP,
    description: "Live guided session for HSC ICT admission problem solving.",
    startsAt: new Date("2026-06-18T14:00:00.000Z"),
    venue: "Online",
    price: 300,
    capacity: 120,
  },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function seedExamTargets() {
  const subjectMap = new Map<string, { id: string; name: string; examType: ExamType }>();
  const topicMap = new Map<string, { id: string; name: string; subjectId: string }>();

  for (const exam of examTargets) {
    const target = await prisma.examTarget.upsert({
      where: { type: exam.type },
      update: {
        name: exam.name,
        description: exam.description,
        isActive: true,
      },
      create: {
        type: exam.type,
        name: exam.name,
        description: exam.description,
      },
    });

    let subjectOrder = 1;

    for (const [subjectName, topicNames] of Object.entries(exam.subjects)) {
      const subject = await prisma.subject.upsert({
        where: {
          examTargetId_slug: {
            examTargetId: target.id,
            slug: slugify(subjectName),
          },
        },
        update: {
          name: subjectName,
          order: subjectOrder,
        },
        create: {
          examTargetId: target.id,
          name: subjectName,
          slug: slugify(subjectName),
          order: subjectOrder,
        },
      });

      subjectMap.set(`${exam.type}:${subjectName}`, {
        id: subject.id,
        name: subject.name,
        examType: exam.type,
      });

      const chapter = await prisma.chapter.upsert({
        where: {
          subjectId_slug: {
            subjectId: subject.id,
            slug: "foundation",
          },
        },
        update: {
          name: "Foundation",
          order: 1,
        },
        create: {
          subjectId: subject.id,
          name: "Foundation",
          slug: "foundation",
          order: 1,
        },
      });

      for (const [topicIndex, topicName] of topicNames.entries()) {
        const topic = await prisma.topic.upsert({
          where: {
            chapterId_slug: {
              chapterId: chapter.id,
              slug: slugify(topicName),
            },
          },
          update: {
            name: topicName,
            order: topicIndex + 1,
          },
          create: {
            chapterId: chapter.id,
            name: topicName,
            slug: slugify(topicName),
            order: topicIndex + 1,
          },
        });

        topicMap.set(`${exam.type}:${subjectName}:${topicName}`, {
          id: topic.id,
          name: topic.name,
          subjectId: subject.id,
        });
      }

      subjectOrder += 1;
    }
  }

  const ibaTarget = await prisma.examTarget.findUnique({
    where: { type: ExamType.IBA },
    select: { id: true },
  });

  if (!ibaTarget) {
    throw new Error("IBA exam target must exist before seeding Computer Science.");
  }

  const computerScienceSubject = await prisma.subject.upsert({
    where: {
      examTargetId_slug: {
        examTargetId: ibaTarget.id,
        slug: "computer-science",
      },
    },
    update: {
      name: "Computer Science",
      order: 4,
    },
    create: {
      examTargetId: ibaTarget.id,
      name: "Computer Science",
      slug: "computer-science",
      description: "Core algorithms and computational thinking for admission readiness.",
      order: 4,
    },
  });

  subjectMap.set(`${ExamType.IBA}:Computer Science`, {
    id: computerScienceSubject.id,
    name: computerScienceSubject.name,
    examType: ExamType.IBA,
  });

  const algorithmsChapter = await prisma.chapter.upsert({
    where: {
      subjectId_slug: {
        subjectId: computerScienceSubject.id,
        slug: "algorithms",
      },
    },
    update: {
      name: "Algorithms",
      order: 1,
    },
    create: {
      subjectId: computerScienceSubject.id,
      name: "Algorithms",
      slug: "algorithms",
      order: 1,
    },
  });

  const greedyTopic = await prisma.topic.upsert({
    where: {
      chapterId_slug: {
        chapterId: algorithmsChapter.id,
        slug: "greedy-algorithms",
      },
    },
    update: {
      name: "Greedy Algorithms",
      order: 1,
    },
    create: {
      chapterId: algorithmsChapter.id,
      name: "Greedy Algorithms",
      slug: "greedy-algorithms",
      order: 1,
    },
  });

  topicMap.set(`${ExamType.IBA}:Computer Science:Greedy Algorithms`, {
    id: greedyTopic.id,
    name: greedyTopic.name,
    subjectId: computerScienceSubject.id,
  });

  return { subjectMap, topicMap };
}

async function seedQuestions(
  subjectMap: Map<string, { id: string; name: string; examType: ExamType }>,
  topicMap: Map<string, { id: string; name: string; subjectId: string }>,
) {
  await prisma.question.deleteMany({
    where: {
      examType: ExamType.IBA,
      source: {
        in: ["IBA DU 2022", "IBA DU 2023", "Kinetic CS Foundations"],
      },
    },
  });

  const englishSubject = subjectMap.get(`${ExamType.IBA}:English`);
  const quantitativeSubject = subjectMap.get(`${ExamType.IBA}:Quantitative`);
  const computerScienceSubject = subjectMap.get(`${ExamType.IBA}:Computer Science`);

  if (!englishSubject || !quantitativeSubject || !computerScienceSubject) {
    throw new Error("IBA English, Quantitative, and Computer Science subjects must exist before seeding questions.");
  }

  for (const [topicName, questions] of Object.entries(englishTemplates)) {
    const topic = topicMap.get(`${ExamType.IBA}:English:${topicName}`);

    if (!topic) {
      throw new Error(`Missing English topic: ${topicName}`);
    }

    for (const [index, [text, options, correctIndex, explanation]] of questions.entries()) {
      await prisma.question.create({
        data: {
          examType: ExamType.IBA,
          text,
          type: "MCQ",
          difficulty: index % 3 === 0 ? "EASY" : index % 3 === 1 ? "MEDIUM" : "HARD",
          year: index % 2 === 0 ? 2022 : 2023,
          source: index % 2 === 0 ? "IBA DU 2022" : "IBA DU 2023",
          explanation,
          subjectId: englishSubject.id,
          topicId: topic.id,
          options: {
            create: options.map((optionText, optionIndex) => ({
              label: String.fromCharCode(65 + optionIndex),
              text: optionText,
              isCorrect: optionIndex === correctIndex,
            })),
          },
        },
      });
    }
  }

  for (const [topicName, questions] of Object.entries(quantitativeTemplates)) {
    const topic = topicMap.get(`${ExamType.IBA}:Quantitative:${topicName}`);

    if (!topic) {
      throw new Error(`Missing Quantitative topic: ${topicName}`);
    }

    for (const [index, [text, options, correctIndex, explanation]] of questions.entries()) {
      await prisma.question.create({
        data: {
          examType: ExamType.IBA,
          text,
          type: "MCQ",
          difficulty: index % 3 === 0 ? "EASY" : index % 3 === 1 ? "MEDIUM" : "HARD",
          year: index % 2 === 0 ? 2022 : 2023,
          source: index % 2 === 0 ? "IBA DU 2022" : "IBA DU 2023",
          explanation,
          subjectId: quantitativeSubject.id,
          topicId: topic.id,
          options: {
            create: options.map((optionText, optionIndex) => ({
              label: String.fromCharCode(65 + optionIndex),
              text: optionText,
              isCorrect: optionIndex === correctIndex,
            })),
          },
        },
      });
    }
  }

  for (const [topicName, questions] of Object.entries(computerScienceTemplates)) {
    const topic = topicMap.get(`${ExamType.IBA}:Computer Science:${topicName}`);

    if (!topic) {
      throw new Error(`Missing Computer Science topic: ${topicName}`);
    }

    for (const [index, [text, options, correctIndex, explanation]] of questions.entries()) {
      await prisma.question.create({
        data: {
          examType: ExamType.IBA,
          text,
          type: "MCQ",
          difficulty: index < 2 ? "EASY" : index < 4 ? "MEDIUM" : "HARD",
          year: 2026,
          source: "Kinetic CS Foundations",
          explanation,
          subjectId: computerScienceSubject.id,
          topicId: topic.id,
          options: {
            create: options.map((optionText, optionIndex) => ({
              label: String.fromCharCode(65 + optionIndex),
              text: optionText,
              isCorrect: optionIndex === correctIndex,
            })),
          },
        },
      });
    }
  }
}

async function seedPromptVersions() {
  for (const prompt of promptSeeds) {
    await prisma.promptVersion.upsert({
      where: {
        useCase_version: {
          useCase: prompt.useCase,
          version: prompt.version,
        },
      },
      update: {
        title: prompt.title,
        body: prompt.body,
        isActive: true,
      },
      create: prompt,
    });
  }
}

async function seedGreedyAlgorithmsPromptVersion(
  topicMap: Map<string, { id: string; name: string; subjectId: string }>,
) {
  const greedyTopic = topicMap.get(`${ExamType.IBA}:Computer Science:Greedy Algorithms`);

  if (!greedyTopic) {
    throw new Error("Greedy Algorithms topic must exist before seeding its prompt.");
  }

  await prisma.promptVersion.upsert({
    where: {
      useCase_version: {
        useCase: AiUseCase.WRONG_ANSWER_EXPLANATION,
        version: 2,
      },
    },
    update: {
      title: "Kino chat: Greedy Algorithms",
      body: "Explain Greedy Algorithms as Kino. Start from the local-choice idea, show when greedy is safe, warn when it fails, and use coin change, activity selection, or Huffman coding as concrete examples.",
      topicId: greedyTopic.id,
      isActive: true,
    },
    create: {
      useCase: AiUseCase.WRONG_ANSWER_EXPLANATION,
      version: 2,
      title: "Kino chat: Greedy Algorithms",
      body: "Explain Greedy Algorithms as Kino. Start from the local-choice idea, show when greedy is safe, warn when it fails, and use coin change, activity selection, or Huffman coding as concrete examples.",
      topicId: greedyTopic.id,
      isActive: true,
    },
  });
}

async function seedEventsAndAchievements() {
  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: event,
      create: event,
    });
  }

  for (const achievement of [
    {
      slug: "logic-master",
      name: "Logic Master",
      description: "Pass your first Socratic defense.",
      icon: "🧠",
      xpReward: 25,
    },
    {
      slug: "feynman-first-win",
      name: "Feynman First Win",
      description: "Score 80+ on a Feynman explanation.",
      icon: "⚡",
      xpReward: 25,
    },
  ]) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: achievement,
      create: achievement,
    });
  }
}

async function seedMentorsCoursesAndCommunity(
  subjectMap: Map<string, { id: string; name: string; examType: ExamType }>,
  topicMap: Map<string, { id: string; name: string; subjectId: string }>,
) {
  for (const achievement of [
    {
      slug: "first-interview",
      name: "First Interview",
      description: "Complete your first Kino interview session.",
      icon: "MIC",
      xpReward: 60,
    },
    {
      slug: "rapid-recall",
      name: "Rapid Recall",
      description: "Finish an active recall set without breaking flow.",
      icon: "FIRE",
      xpReward: 40,
    },
    {
      slug: "perfect-explanation",
      name: "Perfect Explanation",
      description: "Score 100 on a Feynman explanation.",
      icon: "TROPHY",
      xpReward: 100,
    },
  ]) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: achievement,
      create: achievement,
    });
  }

  const mentors = [
    {
      email: "mentor.iba@kinetic.academy",
      name: "Nadia Rahman",
      university: "University of Dhaka",
      department: "IBA",
      examPassed: ExamType.IBA,
      subjectsOffered: ["English", "Quantitative"],
      rateChat: 100,
      rateVideo: 300,
      rating: 4.9,
      sessionsCount: 127,
      shareSlug: "nadia-iba",
      bio: "IBA graduate helping students build test-day reasoning confidence.",
    },
    {
      email: "mentor.medical@kinetic.academy",
      name: "Dr. Samiul Karim",
      university: "Dhaka Medical College",
      department: "Medicine",
      examPassed: ExamType.MEDICAL,
      subjectsOffered: ["Biology", "Chemistry"],
      rateChat: 120,
      rateVideo: 350,
      rating: 4.8,
      sessionsCount: 94,
      shareSlug: "samiul-medical",
      bio: "Medical admission mentor focused on active recall and mistake analysis.",
    },
    {
      email: "mentor.du@kinetic.academy",
      name: "Farhan Islam",
      university: "University of Dhaka",
      department: "Economics",
      examPassed: ExamType.B_UNIT,
      subjectsOffered: ["General Knowledge", "English"],
      rateChat: 90,
      rateVideo: 250,
      rating: 4.7,
      sessionsCount: 81,
      shareSlug: "farhan-du",
      bio: "DU mentor for humanities candidates who need structured revision systems.",
    },
  ];

  for (const mentor of mentors) {
    const user = await prisma.user.upsert({
      where: { email: mentor.email },
      update: {
        name: mentor.name,
        role: UserRole.MENTOR,
      },
      create: {
        email: mentor.email,
        name: mentor.name,
        role: UserRole.MENTOR,
      },
    });

    await prisma.mentorProfile.upsert({
      where: { shareSlug: mentor.shareSlug },
      update: {
        university: mentor.university,
        department: mentor.department,
        examPassed: mentor.examPassed,
        subjectsOffered: mentor.subjectsOffered,
        rateChat: mentor.rateChat,
        rateVideo: mentor.rateVideo,
        rating: mentor.rating,
        sessionsCount: mentor.sessionsCount,
        verified: true,
        bio: mentor.bio,
      },
      create: {
        userId: user.id,
        university: mentor.university,
        department: mentor.department,
        examPassed: mentor.examPassed,
        subjectsOffered: mentor.subjectsOffered,
        rateChat: mentor.rateChat,
        rateVideo: mentor.rateVideo,
        rating: mentor.rating,
        sessionsCount: mentor.sessionsCount,
        verified: true,
        bio: mentor.bio,
        shareSlug: mentor.shareSlug,
      },
    });
  }

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@kinetic.academy" },
    update: {
      name: "Kinetic Faculty",
      role: UserRole.MENTOR,
    },
    create: {
      email: "teacher@kinetic.academy",
      name: "Kinetic Faculty",
      role: UserRole.MENTOR,
    },
  });

  const courses = [
    {
      title: "IBA English Reasoning Sprint",
      description: "Grammar traps, RC strategy, and Feynman explanations in a staged course.",
      subjectId: subjectMap.get(`${ExamType.IBA}:English`)?.id,
    },
    {
      title: "Quantitative Basics War Room",
      description: "Percentages, profit-loss, ratios, and speed problems trained with active recall.",
      subjectId: subjectMap.get(`${ExamType.IBA}:Quantitative`)?.id,
    },
  ];

  for (const course of courses) {
    await prisma.teacherCourse.upsert({
      where: {
        teacherId_title: {
          teacherId: teacher.id,
          title: course.title,
        },
      },
      update: {
        description: course.description,
        subjectId: course.subjectId,
        status: CourseStatus.PUBLISHED,
      },
      create: {
        teacherId: teacher.id,
        title: course.title,
        description: course.description,
        subjectId: course.subjectId,
        status: CourseStatus.PUBLISHED,
      },
    });
  }

  const posts = [
    {
      title: "How do I stop mixing up doesn't and don't?",
      body: "I understand the rule during practice but forget it under time pressure. What active recall drill should I use?",
      topicId: topicMap.get(`${ExamType.IBA}:English:Grammar`)?.id,
      tags: ["grammar", "active-recall"],
      upvotes: 18,
    },
    {
      title: "Ratio questions feel easy until they add totals",
      body: "The parts method works, but I lose track when the question gives difference or total. Any shortcut?",
      topicId: topicMap.get(`${ExamType.IBA}:Quantitative:Ratio`)?.id,
      tags: ["quant", "ratio"],
      upvotes: 23,
    },
  ];

  for (const post of posts) {
    await prisma.communityPost.upsert({
      where: {
        userId_title: {
          userId: teacher.id,
          title: post.title,
        },
      },
      update: {
        body: post.body,
        topicId: post.topicId,
        tags: post.tags,
        upvotes: post.upvotes,
      },
      create: {
        userId: teacher.id,
        title: post.title,
        body: post.body,
        topicId: post.topicId,
        tags: post.tags,
        upvotes: post.upvotes,
      },
    });
  }
}

async function main() {
  const { subjectMap, topicMap } = await seedExamTargets();
  await seedQuestions(subjectMap, topicMap);
  await seedPromptVersions();
  await seedGreedyAlgorithmsPromptVersion(topicMap);
  await seedEventsAndAchievements();
  await seedMentorsCoursesAndCommunity(subjectMap, topicMap);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
