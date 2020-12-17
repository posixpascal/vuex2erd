import * as ts from 'typescript';
import { SourceFile } from 'typescript';
import * as jetpack from 'fs-jetpack';

export const fileToAST = async (path: string) => {
  const sourceText = await jetpack.readAsync(path);
  return ts.createSourceFile('model.ts', sourceText, ts.ScriptTarget.Latest);
};

export const inspect = async (ast: SourceFile, ...inspections) => {
  let isValid = true;
  for await (const inspection of inspections) {
    isValid = isValid && (await inspection(ast));
  }
  return isValid;
};

export const Inspection = {
  hasClass: async (node: SourceFile) => {
    let hasClass = false;
    node.forEachChild((child) => {
      hasClass = hasClass || child.kind === ts.SyntaxKind.ClassDeclaration;
    });

    return hasClass;
  },
};
