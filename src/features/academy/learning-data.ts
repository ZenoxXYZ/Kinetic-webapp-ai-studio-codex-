export type LearningStep = "explain" | "sandbox" | "feynman" | "socratic" | "principles";

export type Concept = {
  id: string;
  title: string;
  subject: string;
  difficulty: "Foundation" | "Intermediate" | "Advanced";
  energyCost: number;
  kineticScore: number;
  summary: string;
  explanation: string;
  examples: Array<{
    title: string;
    input: string;
    output: string;
    annotation: string;
  }>;
  firstPrinciplesClaim: string;
  requiredAxioms: string[];
};

export const concepts: Concept[] = [
  {
    id: "binary-place-value",
    title: "Binary Place Value",
    subject: "ICT",
    difficulty: "Foundation",
    energyCost: 10,
    kineticScore: 25,
    summary: "Convert bits into meaning by rebuilding numbers from powers of two.",
    explanation:
      "Binary is a base-2 counting system. Each position can only be 0 or 1, and each step left doubles the value. The rightmost bit is 1, then 2, then 4, then 8. To decode 1011, keep the places where the bit is 1: 8 + 2 + 1 = 11.",
    examples: [
      {
        title: "Decode 1011",
        input: "1011₂",
        output: "11₁₀",
        annotation: "1×8 + 0×4 + 1×2 + 1×1 = 11",
      },
      {
        title: "Decode 11001",
        input: "11001₂",
        output: "25₁₀",
        annotation: "1×16 + 1×8 + 0×4 + 0×2 + 1×1 = 25",
      },
    ],
    firstPrinciplesClaim: "A binary digit's value depends on its position because each left move doubles the place value.",
    requiredAxioms: [
      "Binary has only two symbols: 0 and 1.",
      "Each position is a power of two.",
      "A 1 means include the place value; a 0 means ignore it.",
    ],
  },
  {
    id: "xor-logic",
    title: "XOR Logic Gate",
    subject: "ICT",
    difficulty: "Intermediate",
    energyCost: 15,
    kineticScore: 35,
    summary: "Understand why XOR is true only when inputs disagree.",
    explanation:
      "XOR means exclusive OR. It returns true when exactly one input is true. If both inputs are false, there is no signal. If both are true, the signals cancel the exclusive condition. This is why XOR is useful for parity checks, toggles, and comparing whether two states differ.",
    examples: [
      {
        title: "Truth table",
        input: "A=1, B=0",
        output: "1",
        annotation: "Inputs disagree, so XOR is true.",
      },
      {
        title: "Same signals",
        input: "A=1, B=1",
        output: "0",
        annotation: "Both are true, but XOR wants exactly one true input.",
      },
    ],
    firstPrinciplesClaim: "XOR detects difference because it is true only when exactly one input is active.",
    requiredAxioms: [
      "Logic gates map input signals to one output signal.",
      "OR allows one or both inputs to be true.",
      "Exclusive OR removes the both-true case.",
    ],
  },
  {
    id: "python-variable",
    title: "Python Variables",
    subject: "Python",
    difficulty: "Foundation",
    energyCost: 12,
    kineticScore: 30,
    summary: "Treat variables as names attached to values, not magic boxes.",
    explanation:
      "A Python variable is a name that points to a value. Python tracks the value's type at runtime, so you do not declare int or string first. If you assign x = 5 and later x = 'five', the name x now points to a different object.",
    examples: [
      {
        title: "Runtime typing",
        input: "x = 5",
        output: "x points to an integer object",
        annotation: "Python infers type from the assigned value.",
      },
      {
        title: "Reassignment",
        input: "x = 'five'",
        output: "x now points to a string object",
        annotation: "The name can be rebound to another value.",
      },
    ],
    firstPrinciplesClaim: "A Python variable is a name binding to an object, and reassignment changes the binding.",
    requiredAxioms: [
      "Programs need names to reuse values.",
      "Values exist as runtime objects.",
      "Assignment binds a name to an object.",
    ],
  },
];

export const events = [
  {
    title: "BDMO Logic Sprint",
    type: "Olympiad",
    date: "June 12",
    price: 0,
    description: "Free 45-minute contest covering binary, parity, and proof puzzles.",
  },
  {
    title: "ICT Crash Workshop",
    type: "Workshop",
    date: "June 18",
    price: 300,
    description: "Live guided session for HSC ICT admission problem solving.",
  },
  {
    title: "Mentor Live: IBA Strategy",
    type: "Mentor Live",
    date: "June 21",
    price: 100,
    description: "Ask recent admits how to split English, Quant, and reasoning prep.",
  },
];

export const battleOpponents = [
  { name: "Ariyan", score: 420, style: "Fast MCQ tapper" },
  { name: "Nusrat", score: 510, style: "Deep explanation defender" },
  { name: "Rafi", score: 470, style: "Binary conversion specialist" },
];
