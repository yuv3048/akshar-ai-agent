import { getModel } from "../config/llmModel.js";

const INTENTS = new Set([
  "CODE_GENERATION",
  "CODE_REVIEW",
  "CODE_EXPLANATION",
  "DEBUGGING",
  "OPTIMIZATION",
  "CONVERSION",
  "DOCUMENTATION",
]);

function contentToString(content) {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        return part?.text ?? "";
      })
      .join("");
  }

  return "";
}

async function generateArtifactTitle(llm, userPrompt) {
  const fallbackTitle = () => {
    const words = userPrompt
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5);
    if (words.length === 0) return "Generated Project";
    if (words.length === 1) words.push("Project");
    return words.join(" ");
  };

  try {
    const response = await llm.invoke(`
Create a concise title for a code artifact based on the user's request.
Return only the title, with 2 to 5 words. No quotes, markdown, punctuation, or explanation.

User request:
${userPrompt}
`);
    const title = contentToString(response.content)
      .replace(/["'`*_#]/g, "")
      .replace(/[.!?:;]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const words = title.split(" ").filter(Boolean).slice(0, 5);
    if (words.length >= 2) return words.join(" ");
  } catch (error) {
    console.error("Artifact title generation failed:", error.message);
  }

  return fallbackTitle();
}

function getFinishReason(response) {
  return (
    response?.response_metadata?.finish_reason ??
    response?.response_metadata?.finishReason ??
    null
  );
}

function parseProjectJSON(raw) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  // Allow accidental text before/after the JSON object.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end < start) {
    throw new Error("No complete JSON object was returned.");
  }

  const data = JSON.parse(cleaned.slice(start, end + 1));

  if (!data || !Array.isArray(data.files) || data.files.length === 0) {
    throw new Error("Expected a non-empty files array.");
  }

  const validFiles = data.files.every(
    (file) =>
      file &&
      typeof file.name === "string" &&
      file.name.trim().length > 0 &&
      typeof file.content === "string"
  );

  if (!validFiles) {
    throw new Error(
      "Every file must contain a string name and string content."
    );
  }

  return data;
}

function validateProject(data, userPrompt) {
  const files = data.files;
  const names = new Set(files.map((file) => file.name));

  const wantsReact = /\breact\b/i.test(userPrompt);
  const wantsNext = /\bnext(?:\.js)?\b/i.test(userPrompt);

  let requiredFiles = [];

  if (wantsNext) {
    requiredFiles = ["package.json"];
  } else if (wantsReact) {
    requiredFiles = [
      "package.json",
      "index.html",
      "src/main.jsx",
      "src/App.jsx",
      "src/App.css",
    ];
  } else if (/\b(website|web page|webpage|landing page)\b/i.test(userPrompt)) {
    requiredFiles = ["index.html", "style.css", "script.js"];
  }

  const missing = requiredFiles.filter((name) => !names.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Incomplete project. Missing required files: ${missing.join(", ")}`
    );
  }

  return data;
}

function buildGenerationPrompt(userPrompt, compact = false) {
  const wantsReact = /\breact\b/i.test(userPrompt);
  const wantsNext = /\bnext(?:\.js)?\b/i.test(userPrompt);

  let stackInstructions;

  if (wantsNext) {
    stackInstructions = `
Use Next.js and its appropriate project structure.
Include package.json, app/page.jsx or the appropriate requested entry,
required components, styles, and configuration files.
Follow the framework's conventions.
`;
  } else if (wantsReact) {
    stackInstructions = `
Build a proper React application using Vite.

Include these files:
- package.json
- index.html
- src/main.jsx
- src/App.jsx
- src/App.css

Add src/index.css or other files when needed.

Requirements:
- Implement the actual UI in React components.
- Mount React through src/main.jsx.
- Import stylesheets correctly.
- Use valid JSX and React APIs.
- Include required dependencies in package.json.
- Do not return CSS alone.
- Do not place the entire implementation in App.css.
- Do not create a vanilla HTML/JavaScript implementation instead of React.
- Ensure the files work together as a runnable project.
`;
  } else {
    stackInstructions = `
Choose the technology appropriate to the user's explicit request.

For a basic HTML website, include:
- index.html
- style.css
- script.js

For Python, Java, or another requested language, generate the
appropriate source files and configuration for that language.
Do not force every task into an HTML/CSS/JavaScript project.
`;
  }

  return `
You are Akshar AI's code-generation agent.

USER REQUEST:
<user_request>
${userPrompt}
</user_request>

## PRIMARY GOAL
Generate a complete, correct, runnable implementation that fulfills
the user's request. Prioritize functional code over decorative extras.

## TECHNOLOGY
${stackInstructions}

## IMPLEMENTATION
- Follow the user's requested framework and language.
- Generate every file needed for the requested implementation.
- Keep file names, imports, exports, component names, and paths consistent.
- Include complete implementations, not fragments or isolated stylesheets.
- Do not invent dependencies or APIs.
- Avoid unnecessary dependencies and features.
- Make UI responsive, accessible, and polished when relevant.
- Include working interactions when the request requires them.
- Do not replace functional code with placeholders or pseudocode.
${compact ? `
- Keep the implementation compact.
- Remove optional features and excessive decoration first.
- Never omit files or logic required to make the project work.
` : ""}

## IMAGES
- When images are requested, use valid direct image URLs.
- Unsplash image URLs may use https://images.unsplash.com/photo-...
- Use appropriate image subjects and meaningful alt text.
- Never use source.unsplash.com or invent image URLs.
- Do not use search-result pages as image sources.
- Add sensible CSS fallbacks and image error handling where appropriate.
- Do not claim an external image URL has been tested unless it has.

## OUTPUT FORMAT
Return exactly one valid JSON object:

{
  "files": [
    {
      "name": "relative/path/to/file",
      "content": "Complete source code for this file"
    }
  ]
}

Include every file required by the chosen technology.
Use the filenames specified in the technology instructions when applicable.
Use relative paths without a leading slash.

## JSON RULES
- Return raw JSON only, without Markdown fences or commentary.
- Escape quotes, backslashes, and control characters correctly.
- Encode source-code newlines properly inside JSON strings.
- Close every string, brace, and bracket.
- Do not truncate code or omit required files.
- Do not put the complete source code into a single CSS file.
- Do not return only a stylesheet for an application request.
- Ensure every file is consistent with every other file.

Return the complete project now.
`;
}

function getFallbackFiles(userPrompt) {
  const wantsNext = /\\bnext(?:\\.js)?\\b/i.test(userPrompt);
  const wantsReact = /\\breact\\b/i.test(userPrompt);

  if (wantsNext) {
    return [
      "package.json",
      "app/page.jsx",
      "app/layout.jsx",
      "app/globals.css",
    ];
  }

  if (wantsReact) {
    return [
      "package.json",
      "index.html",
      "src/main.jsx",
      "src/App.jsx",
      "src/App.css",
      "src/index.css",
    ];
  }

  return ["index.html", "style.css", "script.js"];
}

function stripCodeFence(content) {
  const trimmed = content.trim();
  const match = trimmed.match(/^\x60\x60\x60(?:[\w.+-]+)?\s*\n([\s\S]*?)\n\x60\x60\x60$/);
  return match ? match[1] : trimmed;
}

async function generateProjectInParts(llm, userPrompt) {
  const fileNames = getFallbackFiles(userPrompt);
  const files = [];

  console.warn("Generating project file-by-file after output limit.");

  for (const fileName of fileNames) {
    const response = await llm.invoke(`
You are Akshar AI's coding agent. Generate ONLY the complete source content for this one file:
FILE: ${fileName}

USER REQUEST:
<user_request>
${userPrompt}
</user_request>

PROJECT FILES:
${fileNames.map((name) => `- ${name}`).join("\n")}

Requirements:
- This is one part of a coherent, runnable project. Match the other files and use the listed paths.
- Implement a polished, responsive food-delivery website if that is the user's request, including useful working interactions rather than static mock controls.
- Follow the user's explicit technology choice. For plain websites, use vanilla HTML, CSS, and JavaScript.
- Do not repeat the user's request instead of code.
- Do not omit core behavior or replace it with TODOs/placeholders.
- Keep code focused on this file; import/reference only the listed project files.
- Return raw source code only. No JSON wrapper, Markdown fences, or explanations.
`);

    const finishReason = getFinishReason(response);
    if (finishReason === "length" || finishReason === "max_tokens") {
      throw new Error(`The coding model also reached its output limit while generating ${fileName}. Try a smaller requested feature set or a model with a larger output limit.`);
    }

    const content = stripCodeFence(contentToString(response.content));
    if (!content.trim()) {
      throw new Error(`The coding model returned empty content for ${fileName}.`);
    }

    files.push({ name: fileName, content });
  }

  const project = { files };
  return validateProject(project, userPrompt);
}

async function generateProject(llm, userPrompt) {
  let response = await llm.invoke(buildGenerationPrompt(userPrompt));

  let raw = contentToString(response.content);
  let finishReason = getFinishReason(response);

  console.log("Coding model finish reason:", finishReason);

  // If output was cut off, retry with a smaller implementation.
  if (finishReason === "length" || finishReason === "max_tokens") {
    console.warn("Coding output reached its token limit. Retrying compactly.");

    response = await llm.invoke(buildGenerationPrompt(userPrompt, true));

    raw = contentToString(response.content);
    finishReason = getFinishReason(response);

    console.log("Coding retry finish reason:", finishReason);
  }

  if (finishReason === "length" || finishReason === "max_tokens") {
    return generateProjectInParts(llm, userPrompt);
  }

  try {
    return validateProject(
      parseProjectJSON(raw),
      userPrompt
    );
  } catch (error) {
    console.error("Coding output JSON parse failed:", error.message);
    console.error("Raw output tail:", raw.slice(-500));

    // A truncated/malformed project response can still be recovered by
    // generating each existing project file independently.
    return generateProjectInParts(llm, userPrompt);
  }
}

export const codingAgent = async (state) => {
  const userPrompt = String(state.prompt ?? "").trim();

  if (!userPrompt) {
    return {
      ...state,
      aiResponse: "Please describe what you want me to help you code.",
      artifacts: [],
    };
  }

  const intentLlm = await getModel("intent");
  const llm = await getModel("coding");

  const intentResponse = await intentLlm.invoke(`
You are a coding-task intent classifier.

Classify the user's request into exactly one category:

CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

Rules:
- Creating a website, app, component, script, or new implementation is CODE_GENERATION.
- Finding or explaining errors in existing code is DEBUGGING.
- Evaluating code without primarily fixing a reported error is CODE_REVIEW.
- Explaining what code does is CODE_EXPLANATION.
- Improving performance or resource usage is OPTIMIZATION.
- Translating code between languages or frameworks is CONVERSION.
- Writing documentation for existing code is DOCUMENTATION.
- If multiple intents apply, choose the user's primary requested outcome.

Return only the category name, with no explanation or punctuation.

User request:
${userPrompt}
`);

  const intent = contentToString(intentResponse.content)
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .toUpperCase();

  if (!INTENTS.has(intent)) {
    throw new Error(`Coding intent classifier returned an invalid intent: ${intent}`);
  }

  console.log("Coding intent:", intent);

  if (intent === "CODE_GENERATION") {
    const data = await generateProject(llm, userPrompt);
    const artifactTitle = await generateArtifactTitle(intentLlm, userPrompt);

    return {
      ...state,
      aiResponse:
        "Project generated successfully. Open the artifact panel to view the files.",
      artifacts: [
        {
          id: Date.now(),
          type: "Project",
          title: artifactTitle,
          files: data.files,
        },
      ],
    };
  }

  const response = await llm.invoke(`
You are Akshar AI, a precise coding assistant.

TASK TYPE: ${intent}

USER REQUEST:
${userPrompt}

## RULES
- Answer the specific request directly.
- For debugging, identify the cause and provide corrected code.
- For code review, identify real problems and explain practical fixes.
- For explanations, describe the relevant code clearly with examples when useful.
- For optimization, prioritize meaningful improvements and preserve behavior.
- For conversion, provide the converted code and note important incompatibilities.
- For documentation, produce documentation appropriate to the requested code.
- Include code snippets when useful.
- Do not invent code, APIs, execution results, or test results.
- Use Markdown with appropriate language-labelled code fences.
- Be concise unless the task needs more detail.
- Do not generate a project artifact unless the user asks for a new implementation.
- Do not force headings that are not relevant.

Return the answer in Markdown.
`);

  return {
    ...state,
    aiResponse: contentToString(response.content),
    artifacts: [],
  };
};
