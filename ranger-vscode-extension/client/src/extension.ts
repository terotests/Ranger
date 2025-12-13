/**
 * Ranger Language Support - VS Code Extension Client
 *
 * This extension provides language support for the Ranger programming language,
 * a cross-platform compiler that transpiles to multiple target languages.
 */

import * as path from "path";
import { workspace, ExtensionContext, window } from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // Path to the language server module
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );

  // Debug options for the server
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // Server options - run the server as a Node.js module
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Ranger documents
    documentSelector: [{ scheme: "file", language: "ranger" }],
    synchronize: {
      // Notify the server about file changes to '.rngr' files in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/*.{rgr,ranger}"),
    },
    outputChannelName: "Ranger Language Server",
  };

  // Create the language client and start it
  client = new LanguageClient(
    "rangerLanguageServer",
    "Ranger Language Server",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();

  // Log activation message
  window.showInformationMessage("Ranger Language Support activated!");
  console.log("Ranger Language Support extension is now active");
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
