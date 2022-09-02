import File from "file.js";

export default function Menu() {
  <body>
    <div id="menu" var="menu" onload={function() {
      this.focus();

      this.style.left = mouse.x + "px";
      this.style.top = mouse.y + "px";

      this.onblur = () => {
        this.remove();
      }
    }}>
      <button onclick={() => {
        files.append(
          <input
            placeholder="filename.ext"
            onload={function() {
              this.focus();
            }}
            onchange={function() {
              if(!this.value) return;
              const file = <File
                filetype="file"
                name={this.value}
                stack={JSON.stringify(stack)}
              />
              this.replaceWith(file);
              file.save();
            }}
          />
        )
      }}>Create a File</button>
      <button onclick={() => {
        files.append(
          <input
            placeholder="folder-name"
            onload={function() {
              this.focus();
            }}
            onchange={function() {
              if(!this.value) return;
              const file = <File
                filetype="folder"
                name={this.value}
                stack={JSON.stringify(stack)}
              />
              this.replaceWith(file);
              file.save();
            }}
          />
        )
      }}>Create a Folder</button>
    </div>
  </body>
}