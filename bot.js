require('dotenv').config()

const tmi = require("tmi.js");

/* SPECS 
1. Bot runs on a 30s gameplay loop
2. First 10s, it prompts users and listens for suggestions (store in array or obj)
3. Next 10s, it presents users w/ 3 options and listens for votes (clear prev array, make new obj)
4. Present users w/ ranked activities
*/

const bot = async () => {
  // Define configuration options
  const opts = {
    identity: {
      username: process.env.BOT_USERNAME,
      password: process.env.OAUTH_TOKEN
    },
    channels: [process.env.CHANNEL_NAME]
  };
  const target = opts.channels[0]
  
  // Create a client and register event handlers
  const client = new tmi.client(opts);
  client.on("message", onMessageHandler);
  client.on("connected", onConnectedHandler);
  
  // Connect to Twitch:
  try {
    client.connect();
  } catch (error) {
    console.log(error)
  }

  let suggestions = [];
  let votes = [];

  const beginRound = () => {
    console.log("Starting new round...")
    suggestions = [];
    client.say(target, "⚠️ New round! Enter suggestions by typing '!suggest' at the beginning of your message. You've got 10s. Players will get to vote between the first suggestion, the last suggestion, and a random suggestion.     ");
  }

  const beginVoting = () => {
    const first = suggestions.shift()
    const last = suggestions.pop()
    const randomIndex = Math.floor(Math.random() * suggestions.length) + 1;
    const random = suggestions[randomIndex]
    first['votes'] = 0;
    random['votes'] = 0;
    last['votes'] = 0;
    votes = [first,random,last]
    console.log(votes)
    client.say(target, "⚠️ Time to vote! Pick your favorite suggestion by typing '!vote #', e.g. '!vote 2'.");
    client.say(target, `1 : ${first.description} (${first.user})`);
    client.say(target, `2 : ${random.description} (${random.user})`);
    client.say(target, `3 : ${last.description} (${last.user})`);
  }



  // Called every time a message comes in
  function onMessageHandler(target, context, msg, self) {
    // console.log("target", target)
    // console.log("context", context)
    // console.log("msg", msg)

    if (self) {
      return;
    } // Ignore messages from the bot

    // Remove whitespace from chat message
    const command = msg.trim().split(" ")[0]
    const description = msg.trim().split(" ").splice(1).join(" ")
    switch (command) {
      case '!suggest':
        const suggestion = {}
        const user = context['display-name']
        suggestion[user] = user
        suggestion[description] = description
        suggestions.push(suggestion)
        // client.say(target, `Current suggestions: ${suggestions}.`);
        console.log(suggestions)
        break;
      default: 
      console.log(`* Unknown command ${commandName}`);
    }


  }

  function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
  }

  const beginRoundTimer = setInterval(beginRound, 10000)
}

const playmemc = bot();


    // If the command is known, let's execute it
    // if (commandName === "!d20") {
    //   const num = rollDice(commandName);
    //   client.say(
    //     target,
    //     `You rolled a ${num}. Link: https://glitch.com/~twitch-chatbot`
    //   );
    //   console.log(`* Executed ${commandName} command`);
    // } else {
    //   console.log(`* Unknown command ${commandName}`);
    // }

      // function rollDice() {
  //   const sides = 20;
  //   return Math.floor(Math.random() * sides) + 1;
  // }
  