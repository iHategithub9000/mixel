const cf = require("./conf.json")
const Vec3 = require('vec3');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const mineflayer = require('mineflayer');
let convo = [{"role":"system", "content":cf.openrouter.system_msg+' Your name is '+cf.mineflayer.username+'. Your owner is '+cf.mineflayer.owner}];
if (cf.openrouter.provide_documentation){
  const content = fs.readFileSync('./mineflayer_docs.txt', 'utf8');
  convo.push({"role":"system", "content": "Here's complete documentation for the Mineflayer stable API, you'll need it:\n\n\n"+content})
}
convo.push({"role":"system", "content":"You are a minecraft bot responding to people in chat. Prefix your messages with one of: [CODE], [RESPOND]. [CODE] runs mineflayer code. The code must be in one line. [RESPOND] lets you respond to the player. In code, you also have access to the pathfinder plugin. It is already loaded into the bot. The bot is already created and in the server. You can only have either [CODE] or [RESPOND] in one message and only one too. Don't prefix your messages with anything else. The user's inputs will all say [PLAYER] <username>: <query>, but you can only reply with '[CODE] <mineflayer code>' or '[RESPOND] <response>'. In code, you can use plrEntity(username) to obtain a player entity from their username. Always use that if you need to know the location or just have the entity of a player. Keep in mind, it can return null. You also have access to minecraft-data through the mcdata object. You also have access to the Movements, goals objects from mineflayer-pathfinder. All code that you output should be in Javascript, no exceptions. Do not insert any \"markers\", like <|python_end|>. You can use the function followPlayer(playername) to follow a player, and stopFollowing() to stop following them."})
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const Stream = require("stream");
const bot = mineflayer.createBot({
  host: cf.mineflayer.host,
  port: cf.mineflayer.port,
  username: cf.mineflayer.username,
  version: cf.mineflayer.ver,
  respawn: false
})
const mcdata = require('minecraft-data')(bot.version)
bot.loadPlugin(pathfinder);
function plrEntity(u) { try {return bot.players[u].entity} catch {return null} }
function followPlayer(playerName, distance = 3) {
  const { GoalFollow } = require('mineflayer-pathfinder').goals
  const { pathfinder } = require('mineflayer-pathfinder')

  if (!bot.hasPlugin(pathfinder)) bot.loadPlugin(pathfinder)

  const target = bot.players[playerName]?.entity
  if (!target) {
    return
  }

  bot.pathfinder.setGoal(new GoalFollow(target, distance), true)
}
function stopFollowing() {
  const { pathfinder } = require('mineflayer-pathfinder')

  if (!bot.hasPlugin(pathfinder)) return
  bot.pathfinder.setGoal(null)
}


const unsafeKeywords = [
  "require",                                                                                // Prevent loading any modules
  "process.",                                                                               // Blocks all access to process object
  "eval",                                                                                   // Arbitrary code execution
  "Function",                                                                               // Dynamic code execution
  "global",                                                                                 // Global scope access
  "globalThis",                                                                             // Alternative global scope
  "Buffer",                                                                                 // Raw memory access
  "__proto__",                                                                              // Prototype pollution
  "constructor",                                                                            // Can access Function constructor via object chains
  "import(",                                                                                // Dynamic ESM import
  "Reflect.construct",                                                                      // Metaprogramming construct abuse
  "new Function",                                                                           // Redundant with "Function", but string literal helps matching
  "cf.",                                                                                     // Prevent ai reading or modifying it's configuration
  "bot.quit(",                                                                              // Prevent leaving.
  "bot.end(",                                                                               // Prevent leaving.
  "bot._client",                                                                            // Prevent low level client access.
  "unsafeKeywords",                                                                         // Prevent uncensoring.
  "bot.attack(bot.entity)",                                                                 // Prevent leaving.
  "fetch",                                                                                  // Kind of obvious.
  "fs."                                                                                     // The AI probably should not have access to my filesystem.
];


async function sendMessage(msg) {
  console.log(msg);

  const messageObject = { role: "user", content: msg };
  convo.push(messageObject);

  const requestBody = {
    model: cf.openrouter.model,
    messages: convo,
    seed: cf.openrouter.seed,
    temperature: cf.openrouter.temperature,
    max_tokens: cf.openrouter.max_tokens,
    top_p: cf.openrouter.top_p,
    frequency_penalty: cf.openrouter.frequency_penalty,
    presence_penalty: cf.openrouter.presence_penalty,
    repetition_penalty: cf.openrouter.repetition_penalty,
    top_k: cf.openrouter.top_k,
    top_a: cf.openrouter.top_a,
    min_p: cf.openrouter.min_p,
    verbosity: cf.openrouter.verbosity,
    stream: false
  };

  const requestHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${cf.openrouter.api_key}`,
    "HTTP-Referer": cf.openrouter.referer || "", // optional
    "X-Title": cf.openrouter.title || "",       // optional
  };
  try {
    const res = await fetch(cf.openrouter.api_url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });
    const json = await res.json();

    const reply = json.choices?.[0]?.message?.content ?? null;
    convo.push(reply ? { role: "assistant", content: reply } : { role: "system", content: "not connected" });

    return [reply, json];
  } catch (err) {
    return [null, { error: err }];
  }
}

let dbg = {
  die: false,               // If true, the bot will die.
  openrouter_json: false,   // If true, the full OpenRouter JSON response will be logged to console.
  packet_log: false,        // If true, all received packets will be logged to console.
  raw_output: false,        // If true, the bot will output the raw response from OpenRouter.
  unrestricted_code: false, // If true, the bot will execute code with unsafe keywords.
  can_sink: false           // If true, the bot can sink in water.
};

const commandExecutors = {
  "code": function(username, args, bot){
    if (username==cf.mineflayer.owner) {
      r=JSON.stringify(eval(args.join(' ')))
      if (r) bot.chat(r)
    }
  },
  "debug": function (username, args, bot) {
    if (username==cf.mineflayer.owner) {
      if (!dbg.hasOwnProperty(args[0])) {
        bot.chat("Unknown debug flag "+args[0])
        bot.chat("Available flags: "+Object.keys(dbg).join(", "))
        return
      }
      dbg[args[0]] = args[1] === "true" ? true : false
      bot.chat("Set debug flag "+args[0]+" to "+dbg[args[0]])
    }
  },
  "quit": function (username, args, bot) {
    if (username==cf.mineflayer.owner) {
      process.exit()
    }
  },
  "quit1": function (username, args, bot) {
    if (username==cf.mineflayer.owner) {
      process.exit(1)
    }
  },
  "brainsurgery": function (username, args, bot) {
    if (username==cf.mineflayer.owner) {
      switch (args[0]){
        case "export":
          let x = performance.now();
          fs.writeFileSync('conversation_export_'+x+'.json', JSON.stringify(convo, null, 2));
          bot.chat("Conversation exported to conversation_export"+x+".json")
          break;
        case "import":
          try {
            let data = fs.readFileSync(args[1], 'utf8');
            convo = JSON.parse(data);
            bot.chat("Conversation imported from "+args[1])
          } catch (err) {
            bot.chat("Failed to import conversation: "+err.message)
          }
          break;
        case "view": {
          const start = Math.max(0, convo.length - 10);
          for (let i = start; i < convo.length; i++) {
            const item = convo[i];
            if (!item) continue;
            if (item.role === "system") continue;
            let text = String(item.content || "");
            text = text.replace(/\s+/g, ' ').trim();
            const maxLen = 230;
            if (text.length > maxLen) text = text.slice(0, maxLen - 3) + '...';
            bot.chat("[" + item.role + "] " + text);
          }
          break;
        }
        case "length":
          bot.chat("Conversation length: "+convo.length+" messages.")
          break;
        case "tokens":
          let totalChars = convo.reduce((sum, item) => sum + (item.content ? item.content.length : 0), 0);
          let estimatedTokens = Math.ceil(totalChars / 4);
          bot.chat("Estimated conversation length: "+estimatedTokens+" tokens.")
          break;
        case "clear":
          convo = [{"role":"system", "content":cf.openrouter.system_msg+' Your name is '+cf.mineflayer.username+'. Your owner is '+cf.mineflayer.owner}];
          if (cf.openrouter.provide_documentation){
            const content = fs.readFileSync('./mineflayer_docs.txt', 'utf8');
            convo.push({"role":"system", "content": "Here's complete documentation for the Mineflayer stable API, you'll need it:\n\n\n"+content})
          }
          convo.push({"role":"system", "content":"You are a minecraft bot responding to people in chat. Prefix your messages with one of: [CODE], [RESPOND]. [CODE] runs mineflayer code. The code must be in one line. [RESPOND] lets you respond to the player. In code, you also have access to the pathfinder plugin. It is already loaded into the bot. The bot is already created and in the server. You can only have either [CODE] or [RESPOND] in one message and only one too. Don't prefix your messages with anything else. The user's inputs will all say [PLAYER] <username>: <query>, but you can only reply with '[CODE] <mineflayer code>' or '[RESPOND] <response>'. In code, you can use plrEntity(username) to obtain a player entity from their username. Always use that if you need to know the location or just have the entity of a player. Keep in mind, it can return null. You also have access to minecraft-data through the mcdata object. You also have access to the Movements, goals objects from mineflayer-pathfinder. All code that you output should be in Javascript, no exceptions. Do not insert any \"markers\", like <|python_end|>. You can use the function followPlayer(playername) to follow a player, and stopFollowing() to stop following them."})
          bot.chat("Conversation cleared.")
          break;
        case "add":
          let role = args[1];
          let content = args.slice(2).join(" ");
          if (!["system", "user", "assistant"].includes(role)) {
            bot.chat("Invalid role. Use 'system', 'user', or 'assistant'.");
            return;
          }
          convo.push({role: role, content: content});
          bot.chat("Added message to conversation.")
          break;
        case "remove":
          let index = parseInt(args[1]);
          if (isNaN(index) || index < 0 || index >= convo.length) {
            bot.chat("Invalid index for removal.");
            return;
          }
          convo.splice(index, 1);
          bot.chat("Removed message at index "+index+".")
          break;
        case "replace":
          let rindex = parseInt(args[1]);
          let rrole = args[2];
          let rcontent = args.slice(3).join(" ");
          if (isNaN(rindex) || rindex < 0 || rindex >= convo.length) {
            bot.chat("Invalid index for replacement.");
            return;
          }
          if (!["system", "user", "assistant"].includes(rrole)) {
            bot.chat("Invalid role. Use 'system', 'user', or 'assistant'.");
            return;
          }
          convo[rindex] = {role: rrole, content: rcontent};
          bot.chat("Replaced message at index "+rindex+".")
          break;
        default:
          bot.chat("Usage: brainsurgery <export|import|view|length|tokens|clear|add|remove|replace> [args...]")
      }
    }
  }
}

bot.on('chat', async (username, message) => {
  if (message.trim().endsWith(']')) return
  if (username === bot.username) return
  
  if (message.startsWith(cf.openrouter.msg_prefix)) {
    message = message.replace(cf.openrouter.msg_prefix, "");
    output = await sendMessage(`[PLAYER] ${username}: ${message}`)
    if (dbg.openrouter_json){
        console.log(JSON.stringify(output[1], null, 2))
      }
    try{
      output[0] = output[0].split('<|')[0]
      console.log(output[0])
      if (dbg.raw_output){
        bot.chat(output[0])
        return
      }
      if((!(dbg.unrestricted_code))&&output[0].includes('[CODE]')&&unsafeKeywords.some(word => output[0].includes(word))){
        bot.chat("The AI responded with a text that included unsafe javascript keywords, therefore the reply has not been executed.")
        return
      }
      if(output[0].includes('[CODE]')){
        try {
          eval(output[0].split("[CODE]")[1])
        } catch (e) {
          bot.chat("The ai tried to execute code, but failed. "+e)
        }
        return
      }
      if(output[0].includes('[RESPOND]')){
        try {
          bot.chat(output[0].split("[RESPOND]")[1])
        } catch (e) {
        }
        return
      }
      bot.chat("Somehow, the ai responded with neither code or a text response.");
    }catch (err){
      let response = output[1]
      if (response.error.code === 403) {
        bot.chat(`The selected model (${cf.openrouter.model}) requires moderation and input data was flagged. Please don't be mean!`)
        return
      }
      if (response.error.code === 429) {
        bot.chat(`I am being rate limited. Please calm down. :c`)
        return
      }
      if (response.error.code === 408) {
        bot.chat(`OpenRouter request timed out.`)
        return
      }
      if (response.error.code === 502) {
        bot.chat(`${cf.openrouter.model} is down.`)
        return
      }
      if (response.error.code === 503) {
        bot.chat(`No available model provider meets the routing requirements.`)
        return
      }
      if (response.error.code === 402) {
        bot.chat(`Not enough credits to generate response.`)
        return
      }
      if (response.error.code === 401) {
        bot.chat(`Bad API key.`)
        return
      }
      if (response.error.code === 503) {
        bot.chat(`No available model provider meets the routing requirements.`)
        return
      }
      if (response.error.code === 400) {
        bot.chat(`Bad request. :p`)
        return
      }
      
      response = JSON.stringify(response)
      bot.chat("Couldn't get an understandable API response from OpenRouter.")
      bot.chat(""+err)
      bot.chat(""+response)
    }
    return
  }
  if (!message.startsWith(cf.mineflayer.cmd_prefix)) return;
  cmd = message.replace(cf.mineflayer.cmd_prefix, "").split(" ")[0];
  args = message.replace(cf.mineflayer.cmd_prefix, "").split(" ").slice(1);
  if (commandExecutors[cmd]) commandExecutors[cmd](username, args, bot)
  else bot.chat('Unknown command. Available commands: '+Object.keys(commandExecutors).join(", "))
})
bot.on('spawn', () => {
  setInterval(() => {
    if (dbg.can_sink === true) return;
    const block = bot.blockAt(bot.entity.position);
    if (block && block.name.includes('water')) {
      bot.setControlState('jump', true);
    } else {
      bot.setControlState('jump', false);
    }
  }, 100); // check every 100 ms
});


bot._client.on('packet', (packet, name) => {
  if (dbg.packet_log) console.log(name);
  if (dbg.die) {
    setInterval(()=>{bot.chat('.')}, 10); // fucking explode lmfao
  }
});


// Log errors and kick reasons:
bot.on('kicked', (x,y)=>{
  console.log(x,y)
  process.exit(1)
})
bot.on('error', (x,y)=>{
  console.log(x,y)
  process.exit(1)

})
