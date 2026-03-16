import * as vscode from 'vscode';
import {
  EpicCodeLensProvider,
  StoryFileCodeLensProvider,
  CodeLensActionArgs,
} from './story-codelens-provider';
import { executeAction } from './actions';

export function activate(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = {
    language: 'markdown',
    scheme: 'file',
  };

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
