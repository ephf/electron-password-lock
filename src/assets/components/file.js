export default function File() {
  return (
    <button
      class="file"
      stack={this.stack}
      filetype={this.filetype}
      name={this.name}
      save={function(content) {
        let value = json;
        JSON.parse(this.stack).forEach((key) => value = value.find(({ name }) => name == key).content);
        let file = value.find(({ name }) => name == this.name);

        if(!file) {
          file = {
            type: this.filetype,
            content: this.filetype == "file" ? "" : [],
            name: this.name
          }
          value.push(file);
        }

        this.content = file.content = content ?? file.content;
        files.save();
      }}
      onclick={function() {
        if(this.classList.contains("clicked")) {
          if(this.filetype == "file") {
            openFile(this)
            this.classList.remove("clicked");
            return;
          }
          this.classList.remove("clicked");
          openDirectory(this.name);
          return;
        }

        this.classList.add("clicked");
      }}
    >
      <p class={"icon-" + this.filetype}></p>
      <p class="name">{this.name}</p>
    </button>
  )
}