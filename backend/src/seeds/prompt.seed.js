import Prompt from "../models/Prompt.model.js";

export const seedPrompts = async () => {
    try {
        await Prompt.deleteMany(); // optional (clears all prompts)

        const prompts = [
            {
                title: "Ultimate System Prompt for Helpful AI Assistant",
                promptText: `You are a highly capable AI assistant. 
Always be clear, structured, and helpful. 
If the user asks for something unsafe, refuse politely and suggest alternatives. 
If the user is unclear, ask clarifying questions. 
Prefer step-by-step solutions.`,
                tags: ["system", "assistant", "general"],
                category: "system",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_1",
                isTemplate: false,
                variables: [],
                visibility: "public",
            },

            {
                title: "Fix Any JavaScript Bug Like a Senior Developer",
                promptText: `Act as a senior JavaScript engineer. 
Analyze the given code, explain why it fails, and propose a clean fix. 
Also mention edge cases and best practices.`,
                tags: ["javascript", "debugging", "coding"],
                category: "coding",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_1",
                isTemplate: false,
                variables: [],
                visibility: "public",
            },

            {
                title: "Write a Viral Twitter Post",
                promptText: `Write a viral Twitter/X post about {{topic}}.
Tone: {{tone}}.
Structure:
- Strong hook
- 3 short insights
- One surprising fact
- Call-to-action
Keep it under 280 characters.`,
                tags: ["twitter", "marketing", "viral"],
                category: "marketing",
                modelSupport: ["gpt-4", "gpt-3.5", "claude"],
                createdByClerkId: "seed_user_2",
                isTemplate: true,
                variables: [
                    {
                        key: "topic",
                        description: "What the post is about",
                        defaultValue: "AI prompts",
                        required: true,
                    },
                    {
                        key: "tone",
                        description: "Tone of writing",
                        defaultValue: "bold and confident",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Generate YouTube Video Script",
                promptText: `Create a full YouTube video script for {{topic}}.

Requirements:
- Hook in first 10 seconds
- Engaging storytelling
- Use simple language
- Add jokes and punchlines
- End with CTA

Video duration: {{duration}} minutes.`,
                tags: ["youtube", "script", "content"],
                category: "writing",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_2",
                isTemplate: true,
                variables: [
                    {
                        key: "topic",
                        description: "Topic of the YouTube video",
                        defaultValue: "How AI prompts work",
                        required: true,
                    },
                    {
                        key: "duration",
                        description: "Length of video in minutes",
                        defaultValue: "8",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Midjourney Prompt Generator",
                promptText: `Generate a Midjourney prompt for {{subject}}.

Style: {{style}}
Lighting: {{lighting}}
Camera: {{camera}}

Include: ultra-detailed, cinematic, 8k, sharp focus, high realism.`,
                tags: ["midjourney", "image", "ai-art"],
                category: "image",
                modelSupport: ["midjourney"],
                createdByClerkId: "seed_user_3",
                isTemplate: true,
                variables: [
                    {
                        key: "subject",
                        description: "Main subject of the image",
                        defaultValue: "cyberpunk samurai",
                        required: true,
                    },
                    {
                        key: "style",
                        description: "Art style",
                        defaultValue: "cinematic cyberpunk",
                        required: true,
                    },
                    {
                        key: "lighting",
                        description: "Lighting style",
                        defaultValue: "neon lighting",
                        required: false,
                    },
                    {
                        key: "camera",
                        description: "Camera / lens style",
                        defaultValue: "85mm lens",
                        required: false,
                    },
                ],
                visibility: "public",
            },

            {
                title: "DALL·E Image Prompt Enhancer",
                promptText: `Rewrite the following prompt to make it highly descriptive for DALL·E.

Prompt: "{{prompt}}"

Rules:
- Add environment details
- Add mood + lighting
- Add art style
- Add camera angle if needed`,
                tags: ["dalle", "image-generation", "prompting"],
                category: "image",
                modelSupport: ["dalle"],
                createdByClerkId: "seed_user_3",
                isTemplate: true,
                variables: [
                    {
                        key: "prompt",
                        description: "Base idea for the image",
                        defaultValue: "a cat in space",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Business Idea Generator",
                promptText: `Generate 10 startup ideas in the niche: {{niche}}.

For each idea provide:
- Idea name
- Problem solved
- Target audience
- Monetization model
- MVP features`,
                tags: ["startup", "business", "ideas"],
                category: "business",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_4",
                isTemplate: true,
                variables: [
                    {
                        key: "niche",
                        description: "Industry or niche",
                        defaultValue: "AI productivity",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Perfect Resume Builder Prompt",
                promptText: `Act as an expert resume writer.

Candidate Info:
{{candidate_info}}

Job Description:
{{job_description}}

Task:
Rewrite resume to match ATS keywords.
Output in clean professional format.`,
                tags: ["resume", "career", "job"],
                category: "writing",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_4",
                isTemplate: true,
                variables: [
                    {
                        key: "candidate_info",
                        description: "Candidate background details",
                        defaultValue:
                            "Frontend developer with MERN experience...",
                        required: true,
                    },
                    {
                        key: "job_description",
                        description: "Target job description",
                        defaultValue: "Looking for React developer...",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Code Review Prompt (Clean + Secure)",
                promptText: `Review the following code and suggest improvements:
- readability
- performance
- security issues
- edge cases
- better structure

Code:
{{code}}`,
                tags: ["code-review", "security", "best-practices"],
                category: "coding",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_5",
                isTemplate: true,
                variables: [
                    {
                        key: "code",
                        description: "Paste your code here",
                        defaultValue: "console.log('hello')",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Learn Any Topic in 20 Minutes",
                promptText: `Teach me {{topic}} in the simplest way possible.

Structure:
1. Beginner explanation
2. 5 key concepts
3. Real-world examples
4. Quick quiz
5. Next steps`,
                tags: ["learning", "education", "study"],
                category: "general",
                modelSupport: ["gpt-4", "gpt-3.5", "claude", "gemini"],
                createdByClerkId: "seed_user_6",
                isTemplate: true,
                variables: [
                    {
                        key: "topic",
                        description: "Topic you want to learn",
                        defaultValue: "Blockchain",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Marketing Funnel Generator",
                promptText: `Create a marketing funnel for {{product}}.

Include:
- Audience Persona
- Hook + Offer
- Lead magnet idea
- Email sequence (5 emails)
- Retargeting ad copy`,
                tags: ["marketing", "funnels", "ads"],
                category: "marketing",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_7",
                isTemplate: true,
                variables: [
                    {
                        key: "product",
                        description: "Product/service name",
                        defaultValue: "AI Prompt Marketplace",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "System Prompt: Strict JSON Output",
                promptText: `You must respond ONLY in valid JSON format.
Do not add explanations.

If the user asks a question, respond as:
{
  "answer": "...",
  "confidence": 0-100
}`,
                tags: ["system", "json", "api"],
                category: "system",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_8",
                isTemplate: false,
                variables: [],
                visibility: "public",
            },

            {
                title: "Email Writer: Professional Cold Email",
                promptText: `Write a cold email to {{target}} pitching {{offer}}.

Rules:
- Keep it short
- Friendly tone
- Include value proposition
- End with simple CTA`,
                tags: ["email", "cold-email", "sales"],
                category: "marketing",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_9",
                isTemplate: true,
                variables: [
                    {
                        key: "target",
                        description: "Target audience",
                        defaultValue: "startup founder",
                        required: true,
                    },
                    {
                        key: "offer",
                        description: "What you are offering",
                        defaultValue: "AI-powered website redesign",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Write a Story in Any Style",
                promptText: `Write a short story about {{topic}}.

Style: {{style}}
Length: {{length}}

Include:
- vivid characters
- plot twist
- emotional ending`,
                tags: ["story", "creative-writing", "fiction"],
                category: "writing",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_10",
                isTemplate: true,
                variables: [
                    {
                        key: "topic",
                        description: "Story topic",
                        defaultValue: "a lost astronaut",
                        required: true,
                    },
                    {
                        key: "style",
                        description: "Writing style",
                        defaultValue: "in the style of Christopher Nolan",
                        required: false,
                    },
                    {
                        key: "length",
                        description: "Story length",
                        defaultValue: "800 words",
                        required: false,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Business Plan Generator",
                promptText: `Write a complete business plan for {{business_name}}.

Include:
- Executive summary
- Market analysis
- Competitor analysis
- Pricing model
- Revenue projections
- Marketing plan`,
                tags: ["business-plan", "startup", "strategy"],
                category: "business",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_11",
                isTemplate: true,
                variables: [
                    {
                        key: "business_name",
                        description: "Business name",
                        defaultValue: "PromptVerse",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "SEO Blog Post Generator",
                promptText: `Write an SEO optimized blog post about {{keyword}}.

Requirements:
- Title + meta description
- H1, H2, H3 structure
- FAQs section
- Conclusion with CTA
- Use simple language`,
                tags: ["seo", "blog", "writing"],
                category: "marketing",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_12",
                isTemplate: true,
                variables: [
                    {
                        key: "keyword",
                        description: "Main SEO keyword",
                        defaultValue: "best AI prompts",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Debug Any MERN Stack Error",
                promptText: `Act as a MERN stack debugging expert.

Given error:
{{error}}

Provide:
- root cause analysis
- exact fix
- best practices to avoid`,
                tags: ["mern", "debugging", "fullstack"],
                category: "coding",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_13",
                isTemplate: true,
                variables: [
                    {
                        key: "error",
                        description: "Paste your error message",
                        defaultValue: "MongoNetworkError: failed to connect...",
                        required: true,
                    },
                ],
                visibility: "public",
            },

            {
                title: "Prompt Engineering Cheat Sheet",
                promptText: `Create a prompt engineering cheat sheet with:
- basic prompt format
- role prompting
- few shot examples
- chain of thought prompting
- best practices
- common mistakes`,
                tags: ["prompt-engineering", "cheatsheet", "ai"],
                category: "general",
                modelSupport: ["gpt-4", "claude", "gemini"],
                createdByClerkId: "seed_user_14",
                isTemplate: false,
                variables: [],
                visibility: "public",
            },

            {
                title: "LinkedIn Post Generator",
                promptText: `Write a LinkedIn post about {{topic}}.

Rules:
- Hook line first
- Short paragraphs
- Include 3 takeaways
- Add 5 relevant hashtags`,
                tags: ["linkedin", "marketing", "personal-brand"],
                category: "marketing",
                modelSupport: ["gpt-4", "claude"],
                createdByClerkId: "seed_user_15",
                isTemplate: true,
                variables: [
                    {
                        key: "topic",
                        description: "Topic for LinkedIn post",
                        defaultValue: "AI tools for developers",
                        required: true,
                    },
                ],
                visibility: "public",
            },
        ];

        await Prompt.insertMany(prompts);

        console.log("✅ Seed prompts inserted successfully!");
    } catch (error) {
        console.log("❌ Seed prompts error:", error.message);
    }
};
