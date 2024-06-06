import { AssistantsPlanner } from "@microsoft/teams-ai";

const openAIKey = process.argv[2];
if (!openAIKey) {
  throw new Error("Missing input OpenAI Key");
}

// Create new Assistant
(async () => {
  const assistant = await AssistantsPlanner.createAssistant(openAIKey, {
    name: "Cooking Advisor",
    instructions: "You are a cooking advisor who can help users with recipes around the world",
    tools: [{ type: "function",
      function:{
        name: "get_recipes",
          description: "gets food recipes",
          parameters: {
            type: "object",
            properties: {
              meal: {
                type: "string",
                description: "The meal name"
              },
              language: {
                type: "string",
                description: "language of the prompt"
              }
            },
            required: ["meal", "language"]
          }
      }
  }],
    model: "gpt-3.5-turbo",
  });

  console.log(`Created a new assistant with an ID of: ${assistant.id}`);
})();
