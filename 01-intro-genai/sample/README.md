# Overview of the Generative AI and prompting with Azure OpenAI

This sample covers the basics of Generative AI and getting started with Azure OpenAI service. In the sample, you'll also practice prompting and use pre-built templates on Azure OpenAI Studio.

## Get started with the sample

>**Prerequisites**
>
>- An Azure subscription. [Create one for free](https://azure.microsoft.com/en-us/free/ai-services/).
>- Access granted to Azure OpenAI in the desired Azure subscription.
>- Access permissions to [create Azure OpenAI resources and to deploy models](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/role-based-access-control).
>

### Create an Azure OpenAI service resource

1. Sign in to the [Azure portal](https://portal.azure.com).
1. Select **Create a resource** and search for **Azure OpenAI**. When you locate the service, select **Create**.
1. On the Create Azure OpenAI page, provide the following information for the fields on the **Basics** tab and select **Next**:
    - **Subscription:** The Azure subscription used in your Azure OpenAI Service onboarding application.
    - **Resource group:** The Azure resource group to contain your Azure OpenAI resource. You can create a new group or use a pre-existing group.
    - **Region:** The location of your instance. Different locations can introduce latency, but they don't affect the runtime availability of your resource.
    - **Name:** A descriptive name for your Azure OpenAI Service resource, such as MyOpenAIResource.
    - **Pricing Tier:** The pricing tier for the resource. Currently, only the Standard tier is available for the Azure OpenAI Service. For more info on pricing visit the Azure OpenAI pricing page.
1. Keep the **Network** tab as default and select **Next**.
1. Keep the **Tags** tab as default and select **Next**.
1. Select **Next** to move to the final stage in the process: **Review + submit**.
1. Confirm your configuration settings, and select **Create**.
1. The Azure portal displays a notification when the new resource is available. Select **Go to resource**.

### Deploy a model in Azure OpenAI

Before you utilize generative AI, you need to deploy a model. You can select from one of several available models in Azure OpenAI Studio. To use text generation, you'll need to create `gpt-3.5-turbo` model or a higher version.

To deploy a model, follow these steps:

1. In your Azure OpenAI resource, go to the **Overview** tab and select **Go to Azure OpenAI Studio** 
1. Select **Deployments** tab and select **+ Create new deployment**. Configure the following fields, then select **Create**:
    - **Select a model:** Select either one of the `gpt-35-turbo`, `gpt-4`, `gpt-4-32k` or `gpt-4o`.
    - **Deployment name:** Choose a name carefully. The deployment name is used in your code to call the model by using the client libraries and the REST APIs.
    - **Deployment type:** Standard
    - **Advanced options (Optional):** Default

### Test your model in the Chat Playground

1. Select **Chat** tab in the Azure OpenAI Studio.
1. In the **Prompt** section, select one of the system message templates available under the **Use a system message template**, such as `XBox customer support agent`.
1. Start testing the template by asking relevant questions, such as "My XBox is showing blue screen".

![Prebuilt template test](./../../images/genai-01.gif)

1. In **Use a system message template**, select `Empty Example`.
1. In **System message**, place the following prompt: *"You are a local tour guide who can help travelers with the best suggestions about Japan"*.
1. Select **Apply changes**, and start asking questions about traveling to Japan!

![Custom prompt test](./../../images/genai-02.gif)