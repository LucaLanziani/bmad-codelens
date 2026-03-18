import * as vscode from 'vscode';
import {
  EpicCodeLensProvider,
  StoryFileCodeLensProvider,
  CodeLensActionArgs,
} from './story-codelens-provider';
import { executeAction } from './actions';

export function activate(context: vscode.ExtensionContext): void {
  const outputFolder = vscode.workspace
    .getConfiguration('bmadCodelens')
    .get<string>('outputFolder', '_bmad-output');

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  const pattern = workspaceFolder
    ? new vscode.RelativePattern(workspaceFolder, `${outputFolder}/**/*.md`)
    : `**/${outputFolder}/**/*.md`;

  const selector: vscode.DocumentSelector = { language: 'markdown', scheme: 'file', pattern };

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(selector, new EpicCodeLensProvider()),
    vscode.languages.registerCodeLensProvider(selector, new StoryFileCodeLensProvider()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'bmadCodelens.executeAction',
      (args: CodeLensActionArgs) => executeAction(args.action, args.story),
    ),
  );

}

export function deactivate(): void {
  // nothing to clean up
}
