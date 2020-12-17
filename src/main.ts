import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Parser } from './parser';

yargs(hideBin(process.argv))
  .command(
    'generate <folder> <output>',
    'Load vuexORM models from folder and generate ERD diagram',
    (yargs) => {
      yargs
        .positional('folder', {
          describe: 'The folder to load vuexORM models from',
        })
        .positional('output', {
          describe: 'Output file',
        });
    },
    async (argv) => {
      const parser = new Parser();
      await parser.process(argv.folder as string, argv.output[0] as string, {
        createPNG: !!argv.p,
        verbose: !!argv.v,
      });
    },
  )
  .option('png', {
    alias: 'p',
    type: 'boolean',
    description: 'Export PNG'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  }).argv;
