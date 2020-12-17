import { normalize } from 'path';
import * as jetpack from 'fs-jetpack';
import * as plantuml from 'node-plantuml';
import * as fs from 'fs';
import { fileToAST, inspect, Inspection } from './ast';
import { UML } from './uml';
import { Model } from './model';

const DEFAULT_OPTIONS = {
  createPNG: false, // png
  verbose: false, // verbose
};

export class Parser {
  public path = '';
  public models = [];

  async process(dir: string, output: string, options = DEFAULT_OPTIONS) {
    this.path = normalize(dir);
    console.log('Loading models...');
    this.models = await this.loadModels();

    console.log('Creating PUML...');
    const diagram = await this.diagram();
    await jetpack.writeAsync(output, diagram);

    if (options.createPNG) {
      console.log('Creating PNG...');
      const gen = plantuml.generate(output);
      gen.out.pipe(fs.createWriteStream(output + '.png'));
    }
  }

  async diagram() {
    const uml = new UML();
    this.models.forEach((model) => {
      uml.add(model);
    });

    this.models.forEach((model) => {
      uml.relation(model);
    });

    return uml.render();
  }

  async loadModels() {
    const files = await jetpack.find(this.path, {
      matching: '*.ts',
      directories: false,
      recursive: true,
    });
    const models = [];

    for await (const file of files) {
      const model = await this.parse(file);
      if (!model) {
        continue;
      }

      models.push(model);
    }

    return models;
  }

  async parse(file: string) {
    const ast = await fileToAST(file);
    if (!(await inspect(ast, Inspection.hasClass))) {
      return false;
    }

    const model = new Model(ast);
    return model.hydrate();
  }
}
