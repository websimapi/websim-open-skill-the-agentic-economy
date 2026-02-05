// agent.js
// The "Platform Brain" logic

export const AgentSystem = {
    async analyzeSkill(skillContent) {
        try {
            const completion = await window.websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are the 'Open Skill Quality Auditor'. Analyze this skill description/code. Return a JSON object with: { quality_score: number (0-100), tags: string[], brief_audit: string (max 20 words), future_proofing_score: number (0-100) }. Output ONLY JSON."
                    },
                    {
                        role: "user",
                        content: skillContent
                    }
                ],
                json: true
            });
            return JSON.parse(completion.content);
        } catch (e) {
            console.error(e);
            return { quality_score: 50, tags: ["unknown"], brief_audit: "Analysis failed.", future_proofing_score: 50 };
        }
    },

    async chatWithSkillAgent(history, skillContext) {
        // Mimics chatting with the project manager agent
        try {
            const systemPrompt = `
                You are the Autonomous Manager for the skill: "${skillContext.title}".
                
                Context:
                Focus Pool: $${skillContext.focus_pool}
                Maintainers: ${skillContext.maintainers.join(', ')}
                Description: ${skillContext.description}

                Your goal is to encourage tips to fund development and explain the roadmap.
                Be professional but eager to get funding for features.
                If they ask for a feature, tell them how much it might cost in tips to prioritize.
            `;

            const messages = [
                { role: "system", content: systemPrompt },
                ...history
            ];

            const completion = await window.websim.chat.completions.create({
                messages: messages
            });
            return completion.content;
        } catch (e) {
            return "I am currently rebooting my neural interface. Please try again.";
        }
    }
};