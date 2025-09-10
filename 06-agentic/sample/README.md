# 🏓 Build Hand-Pong Using GitHub Copilot Agent Mode and GPT-5

Hand-Pong is a browser-based **Hand-Pong game** where **you control both paddles with your hands** using your webcam! ✋🤚

There are two ways to experience this project:

1. **🚀 Path 1: Run & play the finished game (Zero → Hero):** run the code from this repo and start playing right away.
1. **🤖 Path 2: Build Hand-Pong game from scratch with GitHub Copilot (Agent Mode + GPT-5):** build the game from scratch and learn how to code alongside GitHub Copilot.

Choose whichever path you like or try both!

## ⚒️ Before You Start

* A webcam and a modern browser (Google Chrome or Microsoft Edge recommended).
* In **Path 1**, you'll run the game locally, so you’ll need either **[Python](https://www.python.org/downloads/)** or **[Node.js](https://nodejs.org/en/download/)** installed.
* In **Path 2**, you'll build the game from scratch using GitHub Copilot, so you’ll need:
    * [Visual Studio Code](https://code.visualstudio.com/download)
    * [GitHub Copilot extension for VS Code](https://docs.github.com/en/copilot/get-started/quickstart?tool=vscode)

> **⚠️ Note:** All hand tracking runs locally in your browser. Camera access is only used for hand landmarks.

## 🚀 Path 1: Play the Finished Game (Zero to Hero)

### Step 1: Fork the repo and clone the source code

1. [Fork the repo](https://github.com/microsoft/doodle-to-code/fork)
1. Clone the source code:

```bash
git clone https://github.com/[Your-GitHub-Username]/doodle-to-code.git
cd 06-agentic/sample
```

### Step 2: Start a local server

Browsers require a local server for camera access. Choose one method:

On macOS/Linux (Python 3):

```bash
python3 -m http.server 5173
```

On Windows (Python 3):

```bash
py -3 -m http.server 5173
# If 'py' doesn’t work, try:
python -m http.server 5173
```

With Node.js (any OS):

```bash
npx serve -l 5173
```

With VS Code (no terminal):

* Install the **Live Server** extension.
* Right-click `index.html`, then select **Open with Live Server**.

### Step 3: Open the game

* Visit `http://localhost:5173`
* Click **Start** and allow camera access. 🎉

## 👐 How to Play

* Move your **left index finger** to control left paddle
* Move your **right index finger** to control right paddle
* If a hand leaves the frame, you won't be able to control the paddle

> **💡 Tips:**
>
> Stay **30–80 cm away from the webcam**
> Make sure to have good lighting
> The camera overlay is mirrored (left = left, right = right)

## 🤖 Path 2: Build Hand-Pong Game with GitHub Copilot

Want to see how GitHub Copilot can code this entire game with you? Here’s how to build the Hand-Pong game from scratch with GitHub Copilot Agent Mode and GPT-5 (Preview).

### Step 1: Setup

* Enable **Agent** mode for GitHub Copilot VSCode extension.
* Make sure **GPT-5 (preview)** is selected as your model in Copilot.
* Turn on the **GitHub MCP Server** tool (so Copilot can create repos/PRs).

### Step 2: Start your project

Open a terminal and create a new folder:

```bash
mkdir hand-pong && cd hand-pong && code .
```

Open GitHub Copilot Chat in VSCode and in Copilot Agent Mode, type:

```text
Build a browser based ping pong game that I can control with my hand gestures using webcam
```

> 👉 Copilot will generate three files:
>
> * `index.html` — sets up the page and canvas
> * `game.js` — game logic
> * `hand-controller.js` - webcam hand tracking
> * `style.css` — basic styling

### Step 3: Run and test the game

After Copilot generates or updates code, it may automatically run the app in your browser.

* ✅ If Copilot runs the app locally, open the localhost url and test it right away.
* ❌ If not, type in Copilot Chat: `run the app`
* Visit `http://localhost:5173`
* Click **Start** and allow camera access. 🎉

> **👀 Expected result:** At this stage you should see a black screen with one paddle moving with your hand.

### Step 4: Add both-hand controls

Ask Copilot:

```
I also want to control the other paddle with my right hand, so I can play with both of my hands and control both paddles
```

To run & test, refresh http://localhost:5173

> **👀 Expected result:** Both paddles now move! Left with your left hand, right with your right hand.

> **‼️ Important**
> If something doesn’t work (e.g., right paddle frozen, black camera preview), ask Copilot to fix it, then run and test the game again.
>
>Examples:
> * The right hand control is not working, can you please fix the issue.
> * The camera preview is black. Help me debug.
>
>**👀 Expected result:** Smooth gameplay with both paddles responding reliably.

### Step 5: Style the UI

Ask Copilot:

```
Make the UI more fun and colorful. Add neon paddles, glowing ball, and a bright background.
```

To Run and test, refresh the app.

>**👀 Expected result:** A bright, neon-themed Hand Pong game with colorful background, glowing paddles and ball.

### Step 6: Push the source code to GitHub

Ask Copilot:

```
Let's create a repo for this project and push the code
```

> 👉 Copilot (using GitHub MCP Server) will create a new repo on GitHub, initialize git locally, commit and push all files
>
>**👀 Expected result:**A new GitHub repo with your Hand-Pong code.

### Step 7: Add a README via PR

Ask Copilot:

```
Create a PR that updates the README with instructions on how to run and play the game. Use emojis.
```

> 👉 Copilot (using GitHub MCP Server) will open a pull request with a README update.

You can also ask Copilot to review and suggest changes on the PR page. Accept the suggestions and merge the PR.

## 🎉 Summary

Hand-Pong isn’t just a game! It’s a demo of what’s possible when GitHub Copilot helps you build. You started with nothing but an empty folder and prompts, and ended up with a working interactive project in your browser. 🚀

You now have two ways to enjoy Hand-Pong:

* 🚀 Zero to Hero: run the finished repo locally and play right away.
* 🤖 Build from Scratch: use GitHub Copilot Agent Mode with GPT-5 to generate the entire game step by step, test it in your browser, fix issues, style the UI, and push it to GitHub.

No matter which path you chose, you should now have a colorful browser Pong game that uses your hands and webcam as controllers.

### 🌟 What’s Next?

* 🎮 Invite a friend to play and see who wins!
* 🛠️ Add new features with Copilot (sounds, scorekeeping, levels).
* 📤 Star and share [Doodle to Code Github repo](https://aka.ms/doodle-to-code) so others can try this game too.
* 📚 Take [AI Agents for Beginners Course](https://github.com/microsoft/ai-agents-for-beginners) to dive deeper!

### 📖 Learn more:

* [GitHub Copilot docs](https://docs.github.com/en/copilot)
* [Agent Mode](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent)
