require('dotenv').config()

const tmi = require("tmi.js");

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
      // client.say(target, "⚠️ New round! Enter suggestions by typing '!suggest' at the beginning of your message. You've got 10s. Players will get to vote between the first suggestion, the last suggestion, and a random suggestion.     ")
      client.say(target, "✏️ PLAY. Suggest Wyatt's next action by typing '!go' first.")
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
        first['position'] = 1;
        last['votes'] = 0;
        last['position'] = 3;
        votes = [first, last]
        if (suggestions.length) {
          const randomIndex = Math.floor(Math.random() * suggestions.length)
          random = suggestions[randomIndex]
          random['votes'] = 0;
          random['position'] = 2;
          votes.push(random)
        }
        console.log("votes", votes)

        let message = "✅ VOTE. Choose which action you want Wyatt to do by typing '!do' then the number."
        message += `----1️⃣: ${first.description}`
        message += `    2️⃣: ${last.description}`
        if (random) message += `    3️⃣: ${random.description}`
        client.say(target, message);
        suggestions = [];
        
        // client.say(target, message)
        // setTimeout(function() {
        //   `1️⃣ : ${first.description}`
        // }, 250)
        // setTimeout(function() {
        //   `2️⃣ : ${last.description}`
        // }, 500)
        // if (random) setTimeout(function() {
        //   `3️⃣ : ${random.description}`
        // }, 750)
        // suggestions = [];
    }
  }

  const endAndRankVotes = () => {
    console.log("Tallying votes...")
    votes.sort((a, b) => (a.votes < b.votes) ? 1 : -1)
    // let message = "⚠️ Voting time is up! The people choose: "
    let message = "👀 WATCH. The winning action was: "
    message += `${votes[0].position}. ${votes[0].description} (${votes[0].votes} votes)`
    client.say(target, message)
    votes = [];
  }

  // const newRound = () => {}

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
      // shorten these to 1 letter
      case '!play':
        beginRound()
        break;
      case '!vote':
        beginVoting()
        break;
      case '!watch':
        endAndRankVotes()
        break;
      case '!time':
        client.say(target, "⏰ You have 10 seconds!")
        break;
      case '!go':
        const suggestion = {}
        const user = context['display-name']
        suggestion['user'] = user
        suggestion['description'] = content
        suggestions.push(suggestion)
        client.whisper(user, `Got it! Thanks ${user}`)
        console.log(suggestions)
        break;
      case '!do':
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
  // beginRound()
  // const beginRoundTimer = setInterval(beginRound, 30000)
  // const beginVoteTimer = setTimeout(function() {
  //   setInterval(beginVoting, 30000)
  // }, 10000)
  // const beginRankTimer = setTimeout(function() {
  //   setInterval(endAndRankVotes, 30000)
  // }, 20000)
}

const playmemc = bot();