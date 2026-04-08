import axios from "axios";
import { config } from "dotenv";
config();

// ─── Configuration (all overridable via .env) ───────────────────────────────────
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OPTIMIZER_MODEL = process.env.OLLAMA_OPTIMIZER_MODEL || "deepseek-r1:8b";
const VERIFIER_MODEL = process.env.OLLAMA_VERIFIER_MODEL || "llama3.1:8b";
const QUALITY_THRESHOLD =
    parseInt(process.env.OPTIMIZATION_THRESHOLD) || 6;
const MAX_ATTEMPTS =
    parseInt(process.env.OPTIMIZATION_MAX_ATTEMPTS) || 3;
const OLLAMA_TIMEOUT =
    parseInt(process.env.OLLAMA_TIMEOUT) || 300000; // 5 min per call

// ─── Ollama Chat Helper ─────────────────────────────────────────────────────────
async function ollamaChat(model, systemPrompt, userMessage) {
    try {
        const response = await axios.post(
            `${OLLAMA_BASE_URL}/api/chat`,
            {
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage },
                ],
                stream: false,
                options: { temperature: 0.7, num_predict: 4096 },
            },
            { timeout: OLLAMA_TIMEOUT },
        );
        return response.data.message.content;
    } catch (error) {
        if (error.code === "ECONNREFUSED") {
            throw new Error(
                "Ollama is not running. Start it with: ollama serve",
            );
        }
        if (error.response?.status === 404) {
            throw new Error(
                `Model '${model}' not found. Pull it first: ollama pull ${model}`,
            );
        }
        throw error;
    }
}

// ─── Output Cleaning ────────────────────────────────────────────────────────────
function cleanOptimizerOutput(text) {
    let cleaned = text;

    // Strip <think>...</think> blocks (DeepSeek R1 reasoning traces)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Strip markdown code block wrappers
    cleaned = cleaned
        .replace(/^```[\w]*\n?/gm, "")
        .replace(/\n?```\s*$/gm, "")
        .trim();

    // Strip common LLM prefixes
    const prefixes = [
        /^here\s*(?:is|'s)\s*(?:the\s*)?(?:optimized|improved|refined|enhanced|rewritten)\s*(?:version\s*(?:of\s*)?(?:the\s*)?)?prompt[:\s-]*/i,
        /^(?:the\s*)?(?:optimized|improved|refined|enhanced)\s*prompt[:\s-]*/i,
        /^(?:the\s*)?final\s*(?:optimized\s*)?prompt[:\s-]*/i,
        /^sure[!,.]?\s*(?:here\s*(?:is|'s)\s*)?(?:the\s*)?(?:optimized|improved)?\s*(?:prompt)?[:\s-]*/i,
        /^certainly[!,.]?\s*(?:here\s*(?:is|'s)\s*)?/i,
        /^of course[!,.]?\s*/i,
    ];
    for (const p of prefixes) cleaned = cleaned.replace(p, "").trim();

    // Strip trailing LLM commentary
    const suffixes = [
        /\n---\n[\s\S]*$/,
        /\n\*{2,}Note[\s\S]*$/i,
        /\nI hope this[\s\S]*$/i,
        /\nLet me know[\s\S]*$/i,
        /\nFeel free[\s\S]*$/i,
    ];
    for (const s of suffixes) cleaned = cleaned.replace(s, "").trim();

    return cleaned;
}

// ─── Score Parsing (robust multi-strategy) ──────────────────────────────────────
function parseVerifierScore(text) {
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // Strategy 1: Clean JSON
    try {
        const json = JSON.parse(cleaned);
        if (typeof json.score === "number")
            return {
                score: Math.min(10, Math.max(0, json.score)),
                feedback: json.feedback || json.reasoning || "",
            };
    } catch {}

    // Strategy 2: JSON embedded in text
    const jsonMatch = cleaned.match(
        /\{[^{}]*"score"\s*:\s*(\d+(?:\.\d+)?)[^{}]*\}/,
    );
    if (jsonMatch) {
        try {
            const json = JSON.parse(jsonMatch[0]);
            return {
                score: Math.min(10, Math.max(0, json.score)),
                feedback: json.feedback || json.reasoning || "",
            };
        } catch {}
    }

    // Strategy 3: "score: N" pattern
    const scoreMatch = cleaned.match(
        /(?:score|rating|quality)\s*[:\-=]\s*(\d+(?:\.\d+)?)/i,
    );
    if (scoreMatch)
        return {
            score: Math.min(10, Math.max(0, parseFloat(scoreMatch[1]))),
            feedback: cleaned,
        };

    // Strategy 4: "N/10" or "N out of 10"
    const fractionMatch = cleaned.match(
        /(\d+(?:\.\d+)?)\s*(?:\/|out\s+of)\s*10/i,
    );
    if (fractionMatch)
        return {
            score: Math.min(10, Math.max(0, parseFloat(fractionMatch[1]))),
            feedback: cleaned,
        };

    // Fallback
    console.warn("[Verifier] Could not parse score:", cleaned.slice(0, 200));
    return { score: 5, feedback: "Score parsing failed." };
}

// ─── System Prompts ─────────────────────────────────────────────────────────────
const OPTIMIZER_SYSTEM_PROMPT = `You are an elite, world-class Prompt Engineer with deep expertise in LLM behavior, instruction architecture, and prompt optimization.

YOUR SOLE OBJECTIVE: Transform the provided raw prompt into an exceptionally clear, precise, and highly effective prompt optimized for Large Language Models.

OPTIMIZATION METHODOLOGY:
1. INTENT ANALYSIS: Deeply understand the core objective.
2. CLARITY & PRECISION: Eliminate all ambiguity. Every instruction must be crystal clear.
3. STRUCTURAL ARCHITECTURE: Organize using Role → Context → Task → Constraints → Output Format.
4. CONTEXTUAL ENRICHMENT: Use Category and Tags to inject domain-specific context.
5. TEMPLATE VARIABLES: If variables ({{variable_name}}) are provided, integrate them seamlessly. Preserve exact variable names. Add enhanced variables if they improve the prompt.
6. MODEL TARGETING: Tailor phrasing for specified target models' best practices.
7. CONSTRAINT INJECTION: Add guardrails, edge-case handling, and output format specs.
8. ANTI-HALLUCINATION: Include instructions that reduce hallucination.

CRITICAL OUTPUT RULES:
- Output ONLY the final, optimized prompt text. Nothing else.
- NO markdown code blocks or backticks wrapping.
- NO prefixes like "Here is the optimized prompt:".
- NO explanations, commentary, or meta-discussion.
- NO pleasantries or sign-offs.
- The output must be directly usable as-is.`;

const VERIFIER_SYSTEM_PROMPT = `You are a rigorous Prompt Quality Evaluator. Assess the quality of an optimized LLM prompt.

EVALUATION CRITERIA (each 0-2 points, total 10):
1. CLARITY: Are instructions unambiguous and easy to parse?
2. COMPLETENESS: Does it cover role, context, task, constraints, output format?
3. STRUCTURE: Is it logically organized with clear flow?
4. SPECIFICITY: Are instructions specific enough for consistent outputs?
5. ROBUSTNESS: Does it handle edge cases with anti-hallucination measures?

SCORING: Be strict but fair. 6+ = production-ready. Below 6 = needs improvement.

OUTPUT FORMAT — respond ONLY with this JSON, nothing else:
{"score": <number 0-10>, "feedback": "<specific, actionable feedback for improvement>"}`;

// ─── Build Messages ─────────────────────────────────────────────────────────────
function buildOptimizerInput(data, previousFeedback) {
    const { title, promptText, category, tags, modelSupport, isTemplate, variables } = data;

    let msg = `OPTIMIZE THE FOLLOWING PROMPT:

METADATA:
- Title: ${title || "Untitled"}
- Category: ${category || "General"}
- Tags: ${tags?.length ? tags.join(", ") : "None"}
- Target Models: ${modelSupport?.length ? modelSupport.join(", ") : "Any"}
- Is Template: ${isTemplate ? "Yes" : "No"}
- Template Variables: ${isTemplate && variables?.length ? JSON.stringify(variables) : "None"}

RAW PROMPT:
${promptText}`;

    if (previousFeedback) {
        msg += `\n\nPREVIOUS ATTEMPT SCORED ${previousFeedback.score}/10 (below threshold).
VERIFIER FEEDBACK: "${previousFeedback.feedback}"
Address this feedback and produce a significantly improved version.`;
    }
    return msg;
}

function buildVerifierInput(originalPrompt, optimizedPrompt, meta) {
    return `EVALUATE THIS OPTIMIZED PROMPT:

ORIGINAL RAW PROMPT (context):
${originalPrompt}

METADATA: Category=${meta.category || "General"}, Tags=${meta.tags?.join(", ") || "None"}, Models=${meta.modelSupport?.join(", ") || "Any"}, HasVariables=${meta.isTemplate ? "Yes" : "No"}

OPTIMIZED PROMPT TO EVALUATE:
${optimizedPrompt}

Respond ONLY with: {"score": <0-10>, "feedback": "<suggestions>"}`;
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────────
export async function runOptimizationPipeline(promptData) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🚀 OPTIMIZATION PIPELINE | Optimizer: ${OPTIMIZER_MODEL} | Verifier: ${VERIFIER_MODEL}`);
    console.log(`   Threshold: ${QUALITY_THRESHOLD}/10 | Max Attempts: ${MAX_ATTEMPTS}`);
    console.log(`${"═".repeat(60)}`);

    const attempts = [];
    let bestResult = null;
    let bestScore = 0;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`\n── Attempt ${attempt}/${MAX_ATTEMPTS} ──`);

        const prevFeedback = attempts.length > 0
            ? { score: attempts.at(-1).score, feedback: attempts.at(-1).feedback }
            : null;

        // Step 1: Optimize
        console.log(`   [1/2] Optimizing with ${OPTIMIZER_MODEL}...`);
        const rawOutput = await ollamaChat(
            OPTIMIZER_MODEL,
            OPTIMIZER_SYSTEM_PROMPT,
            buildOptimizerInput(promptData, prevFeedback),
        );
        const optimizedPrompt = cleanOptimizerOutput(rawOutput);
        console.log(`   [1/2] ✅ Done (${optimizedPrompt.length} chars)`);

        // Step 2: Verify
        console.log(`   [2/2] Verifying with ${VERIFIER_MODEL}...`);
        const rawVerifier = await ollamaChat(
            VERIFIER_MODEL,
            VERIFIER_SYSTEM_PROMPT,
            buildVerifierInput(promptData.promptText, optimizedPrompt, promptData),
        );
        const { score, feedback } = parseVerifierScore(rawVerifier);
        console.log(`   [2/2] ✅ Score: ${score}/10`);

        attempts.push({ attempt, score, feedback });

        if (score > bestScore) {
            bestScore = score;
            bestResult = optimizedPrompt;
        }

        if (score >= QUALITY_THRESHOLD) {
            console.log(`   ✨ PASSED threshold!`);
            break;
        } else if (attempt < MAX_ATTEMPTS) {
            console.log(`   ⚠️  Below threshold, retrying with feedback...`);
        } else {
            console.log(`   ⚠️  Max attempts reached. Using best (score: ${bestScore}/10).`);
        }
    }

    console.log(`\n🏁 PIPELINE COMPLETE | Score: ${bestScore}/10 | Attempts: ${attempts.length}\n`);

    return {
        optimizedPrompt: bestResult,
        pipeline: {
            totalAttempts: attempts.length,
            finalScore: bestScore,
            optimizerModel: OPTIMIZER_MODEL,
            verifierModel: VERIFIER_MODEL,
            threshold: QUALITY_THRESHOLD,
            passed: bestScore >= QUALITY_THRESHOLD,
            attempts,
        },
    };
}
