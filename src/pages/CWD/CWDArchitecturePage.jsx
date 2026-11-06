import CookbookApp from "../../components/CookbookApp";

// Loads every PDF/DOCX in the folder. Name each file exactly like its `id`:
//   src/assets/CWD/docs/02-architecture-questions/<id>.pdf   (or .docx)
const files = import.meta.glob(
  "../../assets/CWD/docs/02-architecture-questions/*.{pdf,docx}",
  { eager: true, query: "?url", import: "default" }
);

const fileById = (id) =>
  Object.entries(files).find(([path]) => path.includes(`/${id}.`))?.[1] || "";

const DESCRIPTION =
  "Prepare a structured interview answer covering the rationale, design, trade-offs and CWD-specific implementation. Section focus: enterprise architecture, trade-offs, risks and failure points.";

const QUESTIONS = [
  ["25-what-makes-cwd-enterprise-architecture-not-simple-chatbot", "What makes CWD an enterprise architecture rather than a simple chatbot?"],
  ["26-major-architectural-trade-offs", "What are the major architectural trade-offs?"],
  ["27-biggest-risks-in-this-architecture", "What are the biggest risks in this architecture?"],
  ["28-architectural-decisions-i-personally-made", "What architectural decisions did you personally make?"],
  ["29-synchronous-components", "Which components are synchronous?"],
  ["30-asynchronous-components", "Which components are asynchronous?"],
  ["31-where-to-introduce-queues", "Where would you introduce queues?"],
  ["32-where-to-introduce-caching", "Where would you introduce caching?"],
  ["33-where-to-introduce-persistence", "Where would you introduce persistence?"],
  ["34-single-points-of-failure", "What are the single points of failure?"],
  ["35-how-to-remove-single-points-of-failure", "How would you remove those single points of failure?"],
];

const CWDArchitecture = QUESTIONS.map(([id, title]) => ({
  id,
  category: "Architecture",
  title,
  description: DESCRIPTION,
  concept: fileById(id), // URL of the PDF/DOCX
  code: "",
}));

export default function CWDArchitecturePage() {
  return (
    <CookbookApp
      data={CWDArchitecture}
      title="CWD Architecture Cookbook"
    />
  );
}
