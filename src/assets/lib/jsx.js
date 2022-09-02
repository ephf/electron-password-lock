window.JSX = {
  Compiler: {
    separateStrings(raw) {
      const data = {
        string: null,
        escaped: false,
        templates: [],
      };
      return [...raw].reduce(
        (array, char) => {
          if (data.escaped) {
            array[array.length - 1] += char;
            data.escaped = false;
            return array;
          }

          if (data.string) {
            array[array.length - 1] += char;
            if (char == data.string) {
              data.string = null;
              array.push("");
            }
            if (data.string == "`" && char == "$") {
              data.string = "$";
            } else if (data.string == "$") {
              if (char == "{") {
                data.templates.unshift({
                  objectCount: 0,
                });
                array.push("");
                data.string = null;
              } else {
                data.string = "`";
              }
            }
            return array;
          }

          if (data.templates.length) {
            switch (char) {
              case "{":
                data.templates[0].objectCount++;
                break;
              case "}":
                if (data.templates[0].objectCount == 0) {
                  data.templates.shift();
                  array.push(char);
                  data.string = "`";
                  return array;
                }
                data.templates[0].objectCount--;
                break;
            }
          }

          switch (char) {
            case "\\":
              data.escaped = true;
              break;
            case '"':
            case "'":
            case "`":
              data.string = char;
              array.push("");
              break;
          }

          array[array.length - 1] += char;
          return array;
        },
        [""]
      );
    },
    compile(raw) {
      const separatedStrings = JSX.Compiler.separateStrings(raw);
      const options = {
        valid: true,
        space: false,
        escaped: false,
        elements: [],
      };
      return separatedStrings.reduce((js, string, i) => {
        if (i % 2) {
          js += string;
          return js;
        }
        options.valid = true;
        options.space = false;
        return (
          js +
          [...string].reduce((js, char, i, a) => {
            if (options.escaped) {
              options.escaped = false;
              return js + char;
            }

            if (options.elements[0]?.open) {
              if (options.elements[0].tag) {
                if (char == ">") {
                  if (options.elements[0].tagClosed) {
                    if (!options.elements[0].inner) char = ">`";
                    options.elements[0].shifting = true;
                    options.elements[0].tag = false;
                  } else {
                    options.elements[0].tag = false;
                  }
                }

                if(!options.elements[0].shifting) {
                  if (char == "/") {
                    options.elements[0].tagClosed = true;
                  } else if (!char.match(/[\n\r ]/)) {
                    options.elements[0].tagClosed = false;
                  }

                  if (options.elements[0]?.gatheringName) {
                    if (char.match(/[\w.:0-9]/)) {
                      options.elements[0].name += char;
                    } else {
                      options.elements[0].gatheringName = false;
                      if (!options.elements[0].name)
                        options.elements[0].name = "JSXCollection";
                      else if (
                        options.elements[0].name[0] !=
                        options.elements[0].name[0].toLowerCase()
                      )
                        options.elements[0].name = `$\{new JSX.Internal.ElementFunction(${options.elements[0].name})}`;

                      if (
                        options.elements[0].name == "body" ||
                        options.elements[0].name == "head"
                      )
                        options.elements[0].name = `jsxappend-${options.elements[0].name}`;

                      char = options.elements[0].name + char;
                    }
                  }
                } else {
                  options.elements.shift();
                }
              } else {
                if (options.elements[0].tagClosed && char == ">") {
                  if (!options.elements[0].inner) char = ">`";
                  options.elements.shift();
                  options.valid = true;
                }

                if (char == "<") {
                  if (a[i + 1] == "/") {
                    options.elements[0].tagClosed = true;
                    if (
                      options.elements[0].name == "jsxappend-body" ||
                      options.elements[0].name == "jsxappend-head"
                    ) {
                      options.elements[0].gatheringName = true;
                      return js + `</${options.elements[0].name}`;
                    }
                    if (options.elements[0].name == "JSXCollection") {
                      options.elements[0].gatheringName = true;
                      return js + "</JSXCollection";
                    }
                  } else {
                    options.elements.unshift({
                      inner: true,
                      open: true,
                      tag: true,
                      tagClosed: false,
                      objectCount: 0,
                      gatheringName: true,
                      name: "",
                    });
                    return js + char;
                  }
                }
              }
              if (char == "{") {
                char = "${";
                options.elements[0].open = false;
                options.valid = true;
              }
              if (options.elements[0]?.gatheringName) return js;
              return js + char;
            }

            if (options.elements[0] && !options.elements[0].open) {
              if (char == "{") {
                options.elements[0].objectCount++;
              }
              if (char == "}") {
                if (options.elements[0].objectCount == 0) {
                  options.elements[0].open = true;
                  return js + char;
                }
                options.elements[0].objectCount--;
              }
            }

            if (char.match(/[\n\r ]/)) {
              options.space = true;
              return js + char;
            }

            switch (char) {
              case "\\":
                options.escaped = true;
                break;
              case "~":
              case "!":
              case "@":
              case "#":
              case "%":
              case "^":
              case "&":
              case "*":
              case "(":
              case "}":
              case "-":
              case "=":
              case "+":
              case "[":
              case "{":
              case "|":
              case ":":
              case ";":
              case ",":
              case "/":
              case ">":
              case "?":
                options.valid = true;
                break;
              case "<":
                if (options.valid) {
                  char = "JSX.createElement`<";
                  options.elements.unshift({
                    inner: false,
                    open: true,
                    tag: true,
                    tagClosed: false,
                    objectCount: 0,
                    gatheringName: true,
                    name: "",
                  });
                  break;
                }
                options.valid = true;
                break;
              default:
                options.valid = false;
                break;
            }

            return js + char;
          }, "")
        );
      }, "");
    },
    compileImports(raw, imported = "") {
      let [empty, rawImports, rest] = raw.split(
        /^((?:[\r\n ]*import.+?[\r\n;]+[\r\n ;]*)+)/
      );
      if (empty) return empty;
      const formattedImports = rawImports
        .split(/[\r\n]+/)
        .map((raw) => raw.trim())
        .filter((a) => a);
      const importsString = formattedImports.reduce((string, im) => {
        let imString = "";
        const [def, other, loc] = im
          .match(
            /import +(?:(?:(\w+?) *,? *)?(?:{(.+?)} *)?from *)?["'](.+?)["']/
          )
          .slice(1);
        if (def || other) imString += "let {";
        if (def) imString += `default:${def}`;
        if (other) imString += `${def ? "," : ""}${other}}=`;
        else if (def) imString += `}=`;
        imString += `await JSX.import("${imported + loc}");\n`;
        return string + imString;
      }, "");
      return importsString + rest;
    },
  },
  Internal: {
    _: {
      compileStack: [],
    },
    onnextcompile(callback, script) {
      this._.compileStack.push({
        callback,
        script,
      });
    },
    functions: [],
    ElementFunction: class ElementFunction {
      constructor(fun) {
        this.fun = fun;
      }
    },
  },
  createElement(html, ...inputs) {
    if (!(html instanceof Array)) {
      html = [html];
    } else {
      html = [...html];
    }
    let completeHTML = html[0];
    inputs.forEach((input, i) => {
      if (typeof input == "function") {
        completeHTML += `"return(JSX.Internal.functions[${JSX.Internal.functions.length}].apply(this,arguments))"`;
        JSX.Internal.functions.push(input);
      } else if (
        input instanceof HTMLElement ||
        input instanceof DocumentFragment
      ) {
        completeHTML += `<JSXElementPlaceholder id="${i}"></JSXElementPlaceholder>`;
      } else if (input instanceof JSX.Internal.ElementFunction) {
        completeHTML += `${input.fun.name} jsxefid=${i}`;
      } else {
        completeHTML += input;
      }
      completeHTML += html[++i];
    });

    const div = document.createElement("div");
    div.innerHTML = completeHTML;
    const replaceRec = (element) => {
      if (!element) return;
      [...element.attributes].forEach(({ name, value }) => {
        if (value.startsWith("return(JSX.Internal.functions")) {
          element[name] = Function(value);
          return;
        }
        element[name] = value;
      });
      if(element.jsxefid) {
        element.replaceWith(
          inputs[Number(element.jsxefid)].fun.apply(element) ?? element
        );
      }
      [...element.children].forEach((child) => replaceRec(child));
      switch (element.nodeName) {
        case "JSXELEMENTPLACEHOLDER":
          element.replaceWith(inputs[Number(element.id)]);
          break;
        case "JSXAPPEND-BODY":
          document.body.append(...element.children);
          break;
        case "JSXAPPEND-HEAD":
          document.head.append(...element.children);
          break;
      }
    };
    replaceRec(div);

    if (div.children[0]?.nodeName == "JSXCOLLECTION") {
      const documentFragment = document.createDocumentFragment();
      documentFragment.append(...div.children[0].children);
      return documentFragment;
    }

    return div.children[0];
  },
  import(path) {
    return new Promise((resolve) => {
      fetch(path)
        .then((res) => res.text())
        .then((rawjs) => {
          let dir = path.split("/").slice(0, -1).join("/");
          if (dir) dir += "/";
          import(
            `data:text/javascript;utf-8,${JSX.Compiler.compileImports(
              JSX.Compiler.compile(rawjs),
              dir
            )}`
          ).then((response) => {
            resolve(response);
          });
        });
    });
  },
};

Array.prototype.collect = function () {
  const documentFragment = document.createDocumentFragment();
  documentFragment.append(...this);
  return documentFragment;
};

new MutationObserver((mutations) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
        const testRec = (node) => {
            if(node.children?.length) {
              [...node.children].forEach((child) => {
                testRec(child);
              })
            }
            if(node.hasAttribute?.("var")) {
              window[node.getAttribute("var")] = node;
            }
            if(node.hasAttribute?.("onload")) {
                node.onload?.();
            }
          }
          testRec(node);
    }
  }
}).observe(document, {
  subtree: true,
  childList: true,
});

{
  const script = document.createElement("script");
  script.type = document.currentScript.type;
  script.async = true;
  if (!script.type) script.type = "module";
  script.text = JSX.Compiler.compile(document.currentScript.innerHTML);
  script.text = JSX.Compiler.compileImports(script.text);
  document.currentScript.replaceWith(script);
}
