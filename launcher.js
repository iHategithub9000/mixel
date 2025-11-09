const cf = require("./conf.json");
const { spawn } = require("child_process");

function update(then){
  console.log('Updating NPM packages...')
  console.log('------------')
  let child;
  if (cf.launcher.is_npm_a_cmd_file) {
    child = spawn(cf.launcher.cmd, ["/c", cf.launcher.npm, 'update', '-y'], {
      stdio: ["inherit", "pipe", "pipe"],
    });
  } else {
    child = spawn(cf.launcher.npm, ['update', '-y'], {
      stdio: ["inherit", "pipe", "pipe"],
    });
  }
  child.stdout.on("data", (data) => {
    data.toString().split(/\r?\n/).forEach((line) => {
      if (line) process.stdout.write(`{upd} ${line}\n`);
    });
  });

  child.stderr.on("data", (data) => {
    data.toString().split(/\r?\n/).forEach((line) => {
      if (line) process.stderr.write(`{upd} ${line}\n`);
    });
  });
  child.on("close", (code) => {
    console.log(`Child exited with code ${code}`);
    console.log(`Starting bot...`)
    setTimeout(then,1000)
  });
}

function startBot() {
  console.log('------------')
  const child = spawn(cf.launcher.node, ["./minecraft_ai.js"], {
    stdio: ["inherit", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    data.toString().split(/\r?\n/).forEach((line) => {
      if (line) process.stdout.write(`{bot} ${line}\n`);
    });
  });

  child.stderr.on("data", (data) => {
    data.toString().split(/\r?\n/).forEach((line) => {
      if (line) process.stderr.write(`{bot} ${line}\n`);
    });
  });



  child.on("close", (code) => {
    console.log(`Child exited with code ${code}`);
    if (cf.launcher.restart_on_kick_or_crash && code !== 0) {
      console.log("Restarting...");
      setTimeout(startBot, 1000); 
    }
  });
}
update(startBot)