# Overview of the Cooking Advisor with the Assistants API Sample

This app template is built on top of [Teams AI library](https://aka.ms/teams-ai-library) and [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview).
It showcases how to build an intelligent chat bot in Teams capable of helping users accomplish a specific task using natural language right in the Teams conversations, such as solving a math problem.

## Get started with the Cooking Advisor with the Assistants API Sample

> **Prerequisites**
>
> To run the Cooking Assistant in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: 16, 18
> - A [Microsoft 365 account for development](https://docs.microsoft.com/microsoftteams/platform/toolkit/accounts)
> - [Teams Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) version 5.0.0 and higher or [Teams Toolkit CLI](https://aka.ms/teamsfx-cli)
> - An account with [OpenAI](https://platform.openai.com/).

### Create your own OpenAI Assistant

Developer's can create their own assistants using one of the options below.

<details>
<summary>Option 1: Create your Assistant using OpenAI Platform</summary>
<br>
Before running or debugging your bot, please follow these steps to setup your own [OpenAI Assistant](https://platform.openai.com/docs/assistants/overview):

1. Go to [OpenAI Platform](https://platform.openai.com) and select `Assistants` from the left-hand side menu, then select `+Create`. Fill the details as the following:

    - **Name:** Cooking Advisor
    - **Instructions:** You are a cooking advisor who can help users with recipes around the world
    - **Model:** gpt-3.5-turbo (or higher)
    - **Functions:** Select `+Functions` to create new, copy the following snippet in the function and `Save`:

    ```json
    {
      "name": "get_recipes",
      "description": "gets food recipes",
      "parameters": {
        "type": "object",
        "properties": {
          "meal": {
            "type": "string",
            "description": "The meal name"
          },
          "language": {
            "type": "string",
            "description": "language of the prompt"
          }
        },
        "required": [
          "meal", "language"
        ]
      }
    }
    ```

    - Finally, select `Playground` on top of the panel to test your Cooking Advisor Assistant.

Some of the example questions you can use to test your assistant in the Playground:

- "Can you help me cook ramen?"
- "How can I make homemade pasta?"

Copy the **Assistant ID** that is available right under your Assistant's name.
</details>
<details>
<summary>Option 2: Create your Assistant using CLI</summary>
<br>
> This app template provides script `src/creator.ts` to help create assistant. You can change the instructions and settings in the script to customize the assistant.
> 
> After creation, you can change and manage your assistants on [OpenAI](https://platform.openai.com/assistants).

1. Open terminal and run command `npm install` to install all dependency packages
   ```
   > npm install
   ```

1. After `npm install` completed, run command `npm run assistant:create -- <your-openai-api-key>`
   ```
   > npm run assistant:create -- xxxxxx
   ```

1. The above command will output something like "*Created a new assistant with an ID of: **asst_xxx...***"

</details>

#### Update the environment variables in the source code

1. Create `.en.testtool.user` under the **env** folder. Fill in both OpenAI API Key and the created Assistant ID into `env/.env.testtool.user`:
   ```
   SECRET_OPENAI_API_KEY=<your-openai-api-key>
   SECRET_OPENAI_ASSISTANT_ID=<your-openai-assistant-id>
   ```

### Run Teams Bot locally

1. In Visual Studio Code, select `Run and Debug` from the left side panel and select `Debug in Test Tool`.
1. When Teams App Test Tool in the browser, you can start testing your Cooking Advisor.

**Congratulations**! You are running an application that can now interact with users:

![Cooking Advisor Assistant](./../../images/assistants%20api%20final.gif)
