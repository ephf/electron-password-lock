import File from "components/file.js";
import Menu from "components/menu.js";

const { readFileSync, writeFileSync, watch, unlinkSync, readdirSync, existsSync, mkdirSync } = require("fs");
const { exec } = require("child_process");

if(!existsSync("temp")) {
  mkdirSync("temp");
}

if(!existsSync("data.lock")) {
  writeFileSync("data.lock", "");
}

window.stack = [];

window.openDirectory = (dirname) => {
  let value = json;
  if(dirname) {
    stack.push(dirname);
  } else if(dirname !== false) {
    stack.pop();
  }
  stack.forEach((key) => value = value.find(({ name }) => name == key).content);
  files.innerHTML = "";

  files.append(...value.map((file) => <File 
    name={file.name}
    filetype={file.type}
    stack={JSON.stringify(stack)}
  />));
}

const bundle = (key, callback, time = 100) => {
  if(bundle[key]) return;
  bundle[key] = callback;
  setTimeout(bundle[key], time);
}

window.openFile = (fileElement) => {
  let value = json;
  const stack = JSON.parse(fileElement.stack);
  
  stack.forEach((key) => value = value.find(({ name }) => name == key).content);

  const file = value.find(({ name }) => name == fileElement.name);

  writeFileSync("temp/" + file.name, file.content);
  exec("start temp/" + file.name);

  watch("temp/" + file.name, () => {
    bundle("file-watch", () => {
      const newContent = readFileSync("temp/" + file.name, "utf-8");
      fileElement.save(newContent);
    });
  });
}

window.onbeforeunload = () => {
  readdirSync("temp").forEach((file) => {
    unlinkSync("temp/" + file);
  });
}

window.mouse = {
  x: 0,
  y: 0
}

window.onmousemove = ({ clientX, clientY }) => {
  mouse.x = clientX;
  mouse.y = clientY;
}

<body>
  <div id="password-wrapper" var="passwordWrapper">
    <input
      id="password"
      type="password"
      placeholder="Password"
      onchange={function() {
        const data = readFileSync("data.lock");
        const passwordBuffer = Buffer.from(this.value);
        
        const rawJSON = Buffer.from([...data].map((byte, i) => byte ^ passwordBuffer[i % passwordBuffer.length])).toString();

        try {
          window.json = JSON.parse(rawJSON || "[]");

          passwordWrapper.replaceWith(<div id="file-explorer" var="files" onload={function() {
            openDirectory(false);
            this.onload = null;
          }} save={() => {
            const buffer = Buffer.from(JSON.stringify(json));
            
            const lock = Buffer.from([...buffer].map((byte, i) => byte ^ passwordBuffer[i % passwordBuffer.length])).toString();

            writeFileSync("data.lock", lock);
          }}></div>);

          document.onmousedown = event => {
            if(!(typeof menu == "undefined")) {
              setTimeout(() => {
                menu.remove();
                window.menu = undefined;
              }, 500);
            }

            if(event.button == 2) {
              event.preventDefault();
              Menu();
            }
          }
        } catch(e) {
          alert("unable to parse json\n" + e.stack);
        }
      }}
    />
  </div>
</body>