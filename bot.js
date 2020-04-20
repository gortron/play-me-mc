require("dotenv").config();

const tmi = require("tmi.js");

const bot = async () => {
  // Define configuration options
  const opts = {
    identity: {
      username: process.env.BOT_USERNAME,
      password: process.env.OAUTH_TOKEN,
    },
    channels: [process.env.CHANNEL_NAME],
  };
  const target = opts.channels[0];
  const moderator = "ironchefgortron";

  // Create a client and register event handlers
  const client = new tmi.client(opts);
  client.on("message", onMessageHandler);
  client.on("connected", onConnectedHandler);

  // Connect to Twitch:
  try {
    client.connect();
  } catch (error) {
    console.log(error);
  }

  let phase = null;
  let suggestions = [];
  let votes = [];

  const reset = () => {
    console.log("Resetting...");
    phase = null;
    suggestions = [];
    votes = [];
  };

  const beginPlay = () => {
    phase = "play";
    console.log("Starting new round...");
    try {
      suggestions = [];
      client.say(
        target,
        "✏️ PLAY. Suggest Wyatt's next action by typing '!go' first."
      );
    } catch (error) {
      console.log(error);
    }
  };

  const beginVotes = () => {
    phase = "vote";
    console.log("Starting voting...");
    let first = null;
    let last = null;
    let random = null;

    try {
      first = suggestions.shift();
      last = suggestions.pop();
      first["votes"] = 0;
      first["position"] = 1;
      last["votes"] = 0;
      last["position"] = 3;
      votes = [first, last];
      if (suggestions.length) {
        const randomIndex = Math.floor(Math.random() * suggestions.length);
        random = suggestions[randomIndex];
        random["votes"] = 0;
        random["position"] = 2;
        votes.push(random);
      }
      let message =
        "✅ VOTE. Choose which action you want Wyatt to do by typing '!do' then the number.";
      message += `---1️⃣: ${first.description}---`;
      message += `2️⃣: ${last.description}---`;
      if (random) message += `3️⃣: ${random.description}`;
      client.say(target, message);
      suggestions = [];
    } catch (error) {
      console.log(error);
    }
  };

  const rankVotes = () => {
    try {
      phase = "watch";
      console.log("Tallying votes...");
      votes.sort((a, b) => (a.votes < b.votes ? 1 : -1));
      let message = "👀 WATCH. The winning action was: ";
      message += `${votes[0].position}. ${votes[0].description} (${votes[0].votes} votes)`;
      client.say(target, message);
      votes = [];
    } catch (error) {
      console.log(error);
    }
  };

  const suggest = (context, content) => {
    if (phase === "play") {
      const suggestion = {};
      const user = context["display-name"];
      suggestion["user"] = user;
      suggestion["description"] = content;
      suggestions.push(suggestion);
      client.whisper(user, `Got it! Thanks ${user}`);
    }
    console.log(suggestions);
  };

  const vote = (content) => {
    if (phase === "vote") {
      if (content === "1") votes[0].votes += 1;
      if (content === "2") votes[1].votes += 1;
      if (content === "3") votes[2].votes += 1;
    }
    console.log(votes);
  };

  executeIfMod = (context, callback) => {
    if (context["display-name"] === moderator) callback();
    else client.say(target, "🔐 Only moderator can do that.");
  };

  // Called every time a message comes in
  function onMessageHandler(target, context, msg, self) {
    // console.log("target", target)
    // console.log("context", context)
    // console.log("msg", msg)

    if (self) {
      return;
    } // Ignore messages from the bot

    // Remove whitespace from chat message
    const command = msg.trim().split(" ")[0];
    const content = msg
      .trim()
      .split(" ")
      .splice(1)
      .join(" ");
    switch (command) {
      case "!reset":
        executeIfMod(context, reset);
        break;
      case "!play":
        executeIfMod(context, beginPlay);
        break;
      case "!vote":
        executeIfMod(context, beginVotes);
        break;
      case "!rank":
        executeIfMod(context, rankVotes);
        break;
      case "!time":
        client.say(target, "⏰ You have 10 seconds!");
        break;
      case "!go":
        suggest(context, content);
        break;
      case "!do":
        vote(content);
        break;
      default:
        console.log(`* Unknown command ${command}`);
    }
  }

  function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
  }
};

const playmemc = bot();
