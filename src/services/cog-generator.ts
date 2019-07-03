import * as yeoman from 'yeoman-environment'

export interface CogGeneratorArgs {
  name: string | undefined
  org: string | undefined
  language: string | undefined
  'output-directory': string | undefined
  'include-example-step': boolean
  packageSafeName?: string
  machineName?: string
}

export class CogGenerator {
  async generate(config: CogGeneratorArgs): Promise<void> {
    const env: yeoman<yeoman.Options> = yeoman.createEnv()

    env.register(require.resolve('../generators/cog'), 'cog')

    if (config['output-directory']) {
      env.cwd = config['output-directory']
    }

    return new Promise((resolve, reject) => {
      env.run('cog', config, (err: Error | null) => {
        if (err) {
          reject(err)
          return
        }

        resolve()
      })
    })
  }

}
