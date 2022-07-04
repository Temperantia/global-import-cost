import * as vscode from "vscode";
import axios from "axios";

const decorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: "red",
    margin: "0 0 0 40px",
  },
});

export async function activate(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const document = editor.document;
  const sourceCode = document.getText().split("\n");
  const decorationsArray: vscode.DecorationOptions[] = [];
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
        const parts = sourceCode[line].split(":");
        const pkg = parts[0].replaceAll('"', "").trim();
        const version = parts[1].replaceAll('"', "").replace(",", "").trim();
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
              after: { contentText: result.data.gzip / 1000 + "k" },
            },
          });
        } catch {}

        ++line;
      }
    }
  }

  editor.setDecorations(decorationType, decorationsArray);
}
