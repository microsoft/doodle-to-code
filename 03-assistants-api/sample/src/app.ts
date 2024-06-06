import { MemoryStorage } from "botbuilder";

// See https://aka.ms/teams-ai-library to learn more about the Teams AI library.
import { Application, AssistantsPlanner, AI } from "@microsoft/teams-ai";

import config from "./config";

// See README.md to prepare your own OpenAI Assistant
if (!config.openAIKey || !config.openAIAssistantId) {
  throw new Error(
    "Missing OPENAI_API_KEY or OPENAI_ASSISTANT_ID. See README.md to prepare your own OpenAI Assistant."
  );
}

// Create AI components
// Use OpenAI
const planner = new AssistantsPlanner({
  apiKey: config.openAIKey,
  assistant_id: config.openAIAssistantId,
});

// Define storage and application
const storage = new MemoryStorage();
const app = new Application({
  storage,
  ai: {
    planner,
  },
});

app.conversationUpdate("membersAdded", async (context) => {
  await context.sendActivity("I'm an assistant bot. How can I help you today?");
});

app.message("/reset", async (context, state) => {
  state.deleteConversationState();
  await context.sendActivity("Ok lets start this over.");
});

app.ai.action(AI.HttpErrorActionName, async (context, state, data) => {
  await context.sendActivity("An AI request failed. Please try again later.");
  return AI.StopCommandName;
});

interface recipeData{
  meal?: string;
  language: string;
  ingredients?: string[];
}

app.ai.action<recipeData>('get_recipes', async(context, state, recipe) =>{
  if(recipe.ingredients != null){
    await context.sendActivity(`Getting delicious recipes for your ingredients ${recipe.ingredients} in ${recipe.language} language`);
    return 'recipe sent!';
  }
  else if(recipe.meal != ""){
    await context.sendActivity(`Getting a delicious recipe for ${recipe.meal} in ${recipe.language} language`);
    return 'recipe sent!';
  }
  else{
    await context.sendActivity("At least give me some ingredients to start with :)");
    return 'recipe not found';
  }
  
});

export default app;
