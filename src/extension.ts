import * as vscode from "vscode";
import axios from "axios";
const Queue = require("queue-promise");

const decorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: "red",
    margin: "0 0 0 40px",
  },
});
let decorationsArray: vscode.DecorationOptions[];

const fetchPackage = async (pkg: string, version: string, line: number) => {
  const url =
    "https://bundlephobia.com/api/size?package=" +
    encodeURI(pkg + "@" + version);
  try {
    const result = await axios.get(url);
    console.log(result);
    decorationsArray.push({
      range: new vscode.Range(
        new vscode.Position(line, 50),
        new vscode.Position(line, 100)
      ),
      renderOptions: {
        after: { contentText: (result.data.gzip / 1000).toFixed(1) + "k" },
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export async function activate() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const document = editor.document;
  const sourceCode = document.getText().split("\n");

  decorationsArray = [];
  const queue = new Queue({
    concurrent: 50,
    interval: 300,
  });
  for (let line = 0; line < sourceCode.length; ++line) {
    if (
      sourceCode[line].search('"dependencies"') !== -1 ||
      sourceCode[line].search('"devDependencies"') !== -1
    ) {
      ++line;
      while (
        sourceCode[line].trim() !== "}" &&
        sourceCode[line].trim() !== "}," &&
        line < sourceCode.length
      ) {
        console.log(line);
        const parts = sourceCode[line].split(":");
        const pkg = parts[0].replaceAll('"', "").trim();
        const version = parts[1].replaceAll('"', "").replace(",", "").trim();
        const lineCopy = line;
        queue.enqueue(() => fetchPackage(pkg, version, lineCopy));
        ++line;
      }
    }
  }

  queue.on("stop", () => {
    editor.setDecorations(decorationType, decorationsArray);
  });
}
