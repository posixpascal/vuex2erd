import * as ts from 'typescript';
import { MethodDeclaration } from 'typescript';

export class Model {
  private vuexFieldsNode: MethodDeclaration = null;

  constructor(private ast: ts.SourceFile) {}

  public name = '';
  public properties = [];
  public methods = [];
  public relations = [];

  hydrate() {
    const parseNode = (child) => {
      switch (child.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          this.name = child.name.escapedText;
          child.forEachChild(parseNode);
          break;

        case ts.SyntaxKind.MethodDeclaration:
          // Check for static fields property
          let isVuexFieldsMethod = false;
          child.forEachChild((node) => {
            if (node.kind === ts.SyntaxKind.StaticKeyword) {
              isVuexFieldsMethod = true;
            }
          });

          if (!isVuexFieldsMethod) {
            return;
          }

          let vuexFieldsNode = false;
          child.forEachChild((node) => {
            if (
              node.kind === ts.SyntaxKind.Identifier &&
              node.escapedText === 'fields'
            ) {
              vuexFieldsNode = true;
            }
          });

          if (vuexFieldsNode) {
            this.vuexFieldsNode = child;
          }

          break;
      }
      return;
    };

    this.ast.forEachChild(parseNode);

    if (!this.vuexFieldsNode) {
      console.info('Model does not have static fields() method');
      return null;
    }

    this.parseVuexFields();
    return this;
  }

  private parseVuexFields() {
    const properties = [];
    const parseNode = (child) => {
      switch (child.kind) {
        case ts.SyntaxKind.Block:
          child.forEachChild(parseNode);
          break;

        case ts.SyntaxKind.ReturnStatement:
          child.forEachChild(parseNode);
          break;

        case ts.SyntaxKind.ObjectLiteralExpression:
          child.forEachChild(parseNode);
          break;

        case ts.SyntaxKind.PropertyAssignment:
          properties.push(child);
          break;
      }
    };

    this.vuexFieldsNode.forEachChild(parseNode);

    properties.map((propertyNode: any) => {
      const property: any = {};

      property.name = propertyNode.name.escapedText;
      property.type = propertyNode.initializer.expression.name.escapedText;
      const args = propertyNode.initializer.arguments.map((arg) => arg.text);

      switch (property.type) {
        case 'belongsTo':
        case 'belongsToMany':
        case 'hasMany':
        case 'hasOne':
          this.relations.push({
            type: property.type,
            target: args[0],
            property: args[1],
          });
          break;

        case 'morphMany':
          this.relations.push({
            type: property.type,
            target: args[0],
            morphField: args[1],
            morphTypes: args[2],
          });
          break;

        case 'hasManyThrough':
          this.relations.push({
            type: property.type,
            target: args[0],
            through: args[1],
            throughField: args[2],
            targetField: args[3],
          });
          break;
      }

      this.properties.push(property);
    });
  }
}
