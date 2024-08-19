# Deploy to a Teams App using Azure OpenAI Studio On Your Data

This sample shows how to create a custom engine copilot that uses the Azure OpenAI Chat Completions API **Azure OpenAI On Your Data** feature to facilitate RAG (retrieval augmented generation) and test it on Microsoft Teams.

You can integrate your data from Azure AI Search, Azure Blob Storage, URL/web address, Azure Cosmos DB for MongoDB vCore, uploaded files, and Elasticsearch. Then, you can deploy to a standalone Teams app (preview) directly from Azure OpenAI Studio, enabling you to bring conversational experience to your users in Teams to improve operational efficiency and democratize access of information. The source code of this app is powered by Teams AI library that helps you utilize the AI features and connect with your data from Azure.

This guide will show you how to set up your custom engine copilot for Teams using Azure OpenAI Studio and Teams Toolkit.

## Pre-requisites

- [Visual Studio Code](https://code.visualstudio.com)
- [Teams Toolkit](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)  
- [Node.js](https://nodejs.org/en)
- [Microsoft Teams](https://www.microsoft.com/microsoft-teams/download-app)
- [Microsoft 365 developer account](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/build-and-test/prepare-your-o365-tenant)
- [Azure OpenAI](https://oai.azure.com/portal) with `text-embedding-ada-002` and `gpt-35-turbo` or higher deployed
- [Microsoft&nbsp;Edge](https://www.microsoft.com/edge) (recommended) or [Google Chrome](https://www.google.com/chrome/)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Cognitive Services OpenAI User](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control#:~:text=to%20a%20role.-,Cognitive%20Services%20OpenAI%20User,-If%20a%20user)

## Setting up your AI app in Azure OpenAI Studio

1. Open [Azure OpenAI Studio](https://oai.azure.com/portal) and select **Chat** from the menu. Locate the `Prompt` tab under the Setup and replace the **System Message** with the following lines. Select **Apply Changes**:

    ```
    You are an AI assistant named Coffee Cup that helps people find information about nutrition of coffee options using given data. 
    Always introduce yourself in the beginning, use emojis where appropriate.
    ```

1. To ingest your data, select `Add your data` tab, select **Add a data source**, then **Upload files (preview)**.
1. Select your subscription, Azure Blob Storage, Azure AI Search. If you don't these resources created earlier, select the option to create new.
1. Enter an index name, such as `coffee-shops`.
1. Check the box for "Add vector search to this search resource." and select your embedding model and select **Next**.
1. Drag and drop the files from `src/data/` folder and select **Next**.
1. Select the search type as `Vector` and then **Next**.
1. Select the authentication type as **API key** and then **Next**.
1. Finally, select **Save and close**.
1. Once the data ingestion is complete, ask similar questions to the following examples:
    - *What are my options for cold brew?*
    - *How about iced latte?*
    - *Can you share the options for cappuccino with almond milk?*

1. After testing your data, click **Deploy to** and then **A new Teams app(preview)**.
1. Enter the name of your Teams app such as "CoffeeCup".
1. Click `download` to download your Teams app as a zip file.
1. Open the location of where you downloaded the zip file and extract the zip file.

### Chat with your AI app on Microsoft Teams

Note: Testing this sample requires that you are logged into Azure CLI and you have [Cognitive Services OpenAI User role assigned to you](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control#add-role-assignment-to-an-azure-openai-resource) per the prerequisites.

1. Go to Visual Studio Code.
1. Select `File > Open Folder`.
1. Go to the location where you extracted your Teams app folder and select it.
1. If you chose `API key` in data connection, manually copy and paste your Azure AI Search key in `src\prompts\chat\config.json` file. Your **Azure AI Search Key** can be found in Azure OpenAI Studio Playground by clicking the `View code` button and looking under **Azure Search Resource Key**. If you chose `system assigned managed identity`, you can skip this step. Learn more about different data connection options in the [Data connection section](https://review.learn.microsoft.com/en-us/azure/ai-services/openai/concepts/use-your-data?tabs=ai-search%2Ccopilot&branch=pr-en-us-277392#data-connection).
1. Open the Visual Studio Code terminal by selecting `View > Terminal` and log into Azure CLI selecting the Azure account that you assigned Cognitive Service OpenAI User role to. Use the following command to log in:

   ```bash
     az login
   ```

1. To debug your app, press the `F5` key or from the left pane, select `RUN AND DEBUG ▷` (Ctrl+Shift+D) and then select `Debug in (Edge)` or `Debug in (Chrome)` from the dropdown list.  Select `Run > Start Debugging` (F5). A webpage opens where you can chat with your custom copilot.

**Note:** The citation experience is only available in Teams, make sure to debug in Edge or Chrome instead of the Test Tool.

![Coffee Cup Gif](../../images/coffee-cup.gif)