# Overview of the Clippy Chatbot Sample

This app template is built on top of [Teams AI library](https://aka.ms/teams-ai-library).
It showcases a bot app that responds to user questions like Clippy. This enables your users to talk with the AI bot in Teams.

## Get started with the template

> **Prerequisites**
>
> To run the template in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: 16, 18.
> - [Teams Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) latest version or [Teams Toolkit CLI](https://aka.ms/teamsfx-toolkit-cli).
> - Prepare your own [Azure OpenAI](https://aka.ms/oai/access) resource.

> For local debugging using Teams Toolkit CLI, you need to do some extra steps described in [Set up your Teams Toolkit CLI for local debugging](https://aka.ms/teamsfx-cli-debugging).

1. First, select the Teams Toolkit icon on the left in the VS Code toolbar.
1. In file *env/.env.testtool.user*, fill in your Azure OpenAI key `SECRET_AZURE_OPENAI_API_KEY=<your-key>`, endpoint `AZURE_OPENAI_ENDPOINT=<your-endpoint>`, and deployment name `AZURE_OPENAI_DEPLOYMENT_NAME=<your-deployment>`.
1. Press F5 to start debugging which launches your app in Teams App Test Tool using a web browser. Select `Debug in Test Tool`.
1. You can send any message to get a response from the bot.

**Congratulations**! You are running an application that can now interact with users in Teams App Test Tool:

![Basic AI Chatbot](https://github.com/OfficeDev/TeamsFx/assets/9698542/9bd22201-8fda-4252-a0b3-79531c963e5e)