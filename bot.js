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
    try {
      suggestions = [];
      client.say(target, "⚠️ New round! Enter suggestions by typing '!suggest' at the beginning of your message. You've got 10s. Players will get to vote between the first suggestion, the last suggestion, and a random suggestion.     ")
    } catch (error) {
      console.log(error)
    }
  }

  const beginVoting = () => {
    console.log("Starting voting...")
    let first = null;
    let last = null;
    let random = null;

    switch (suggestions.length) {
      case 0:
        client.say(target, "I didn't get any suggestions. You can't think of ANYTHING you'd like Wyatt to do?!")
        break;
      case 1:
        first = suggestions.shift()
        client.say(target, `I only heard one suggestion: ${first.description} (from ${first.user})`);;
        break;
      default:
        first = suggestions.shift()
        last = suggestions.pop()
        first['votes'] = 0;
        last['votes'] = 0;
        votes = [first, last]
        if (suggestions.length) {
          const randomIndex = Math.floor(Math.random() * suggestions.length)
          random = suggestions[randomIndex]
          random['votes'] = 0;
          votes.push(random)
        }
        console.log("votes", votes)
        let message = "⚠️ Time to vote! Pick your favorite suggestion by typing '!vote #', e.g. '!vote 2'.    "
        message += `    1 : ${first.description} (${first.user})    `
        message += `    2 : ${last.description} (${last.user})    `
        if (random) message += `    3 : ${random.description} (${random.user})    `
        client.say(target, message);
        // client.say(target, `1 : ${first.description} (${first.user})`);
        // if (random) client.say(target, `2 : ${random.description} (${random.user})`);
        // client.say(target, `3 : ${last.description} (${last.user})`);
    }
  }

  const endAndRankVotes = () => {
    console.log("Tallying votes...")
    votes.sort((a, b) => (a.votes < b.votes) ? 1 : -1)
    let message = "⚠️ Voting time is up! The people choose: "
    message += `${votes[0].description} (${votes[0].votes} votes)`
    client.say(target, message)
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
    const content = msg.trim().split(" ").splice(1).join(" ")
    switch (command) {
      case '!suggest':
        const suggestion = {}
        const user = context['display-name']
        suggestion['user'] = user
        suggestion['description'] = content
        suggestions.push(suggestion)
        client.whisper(user, `Got it! Thanks ${user}`)
        console.log(suggestions)
        break;
      case '!vote':
        if (content === '1') votes[0].votes += 1;
        if (content === '2') votes[1].votes += 1;
        if (content === '3') votes[2].votes += 1;
        console.log(votes)
        break;
      default: 
        console.log(`* Unknown command ${command}`);
    }


  }

  function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
  }

  // Set timers for gameplay. Start a new round every 30s.
  beginRound()
  const beginRoundTimer = setInterval(beginRound, 30000)
  const beginVoteTimer = setTimeout(function() {
    setInterval(beginVoting, 30000)
  }, 10000)
  const beginRankTimer = setTimeout(function() {
    setInterval(endAndRankVotes, 30000)
  }, 20000)
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
  