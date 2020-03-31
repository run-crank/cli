import {IConfig} from '@oclif/config'
import * as fs from 'fs'

import {ManifestRequest} from '../../proto/cog_pb'
import {CogManager} from '../../services/cog-manager'
import StepAwareCommand from '../../step-aware-command'

export default class ReadMe extends StepAwareCommand {
  static description = `Adds usage instructions to README.md in current directory
The readme must have any of the following tags inside of it for it to be replaced or else it will do nothing:
### Authentication
<!-- authenticationDetails -->
### Steps
<!-- stepDetails -->
`
  static flags = {}

  static args = [{
    name: 'cogName',
    description: 'The name of the Cog the README.md represents',
  }]

  protected cogManager: CogManager

  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.cogManager = new CogManager({registries: this.registry})
  }

  async run() {
    let readme: string
    const {args} = this.parse(ReadMe)

    // Make sure the Cog specified exists.
    const cogRegistry = this.registry.buildCogRegistry()
    const cogRegEntry = cogRegistry.filter(r => r.name && r.name === args.cogName)[0]
    if (!cogRegEntry || !cogRegEntry._runConfig) {
      this.error(`Cog with name ${args.cogName} not found`, {exit: false})
      return this.exit(1)
    }

    // Make sure there's a README.md file.
    try {
      readme = fs.readFileSync('README.md', 'utf8')
    } catch (e) {
      this.error('No README.md file found! Check your current working directory and try again.', {exit: false})
      return this.exit(e ? 1 : 1)
    }

    const client = await this.cogManager.startCogAndGetClient(cogRegEntry._runConfig, false)
    await new Promise(resolve => {
      client.getManifest(new ManifestRequest(), (err, manifest) => {
        if (err) {
          this.log(`There was a problem reading Cog metadata from ${args.cogName}: ${err.toString()}`)
          process.exitCode = 1
          return
        }

        const manifestObj = manifest.toObject()
        let stepMd = 'This Cog does not have any steps defined yet!'
        let authMd = 'This Cog does not require any authentication details.'

        if (manifestObj.stepDefinitionsList.length) {
          stepMd = '| Name (ID) | Expression | Expected Data |\n'
          stepMd += '| --- | --- | --- |\n'
          stepMd += manifestObj.stepDefinitionsList
            .map(this.stepDefinitionAsMarkdown.bind(this))
            .join('\n').trim()
        }

        if (manifestObj.authFieldsList.length) {
          const authMdPrefix = 'You will be asked for the following authentication details on installation. To avoid prompts in a CI/CD context, you can provide the same details as environment variables.'
          const authMdSuffix = `\`\`\`shell-session\n# Re-authenticate by running this\n$ crank cog:auth ${manifestObj.name}\n\`\`\``
          authMd = '| Field | Install-Time Environment Variable | Description |\n'
          authMd += '| --- | --- | --- |\n'
          authMd += manifestObj.authFieldsList
            .map(this.authFieldsAsMarkdown.bind(this))
            .join('\n').trim()
          authMd = `${authMdPrefix}\n\n${authMd}\n\n${authMdSuffix}`
        }

        readme = this.replaceTag(readme, 'authenticationDetails', authMd)
        readme = this.replaceTag(readme, 'stepDetails', stepMd)
        readme = readme.trimRight()
        readme += '\n'
        fs.writeFileSync('README.md', readme, {encoding: 'utf8'})
        client.close()
        resolve()
      })
    })
    this.cogManager.stopAllCogs()
  }

  replaceTag(readme: string, tag: string, body: string): string {
    if (readme.includes(`<!-- ${tag} -->`)) {
      if (readme.includes(`<!-- ${tag}End -->`)) {
        readme = readme.replace(new RegExp(`<!-- ${tag} -->(.|\n)*<!-- ${tag}End -->`, 'm'), `<!-- ${tag} -->`)
      }
      this.log(`replacing <!-- ${tag} --> in README.md`)
    }
    return readme.replace(`<!-- ${tag} -->`, `<!-- ${tag} -->\n${body}\n<!-- ${tag}End -->`)
  }

  stepDefinitionAsMarkdown(stepDef: Record<string, any>): string {
    // tslint:disable-next-line:no-this-assignment
    const self = this
    return `| **${stepDef.name}**<br>(\`${stepDef.stepId}\`) | \`${stepDef.expression.replace(/\|/g, '\\|')}\` | ${self.stepExpectedFieldsAsMarkdown(stepDef.expectedFieldsList).trim()} |`
  }

  stepExpectedFieldsAsMarkdown(expectedFieldsList: Record<string, any>[]): string {
    return expectedFieldsList.map(field => {
      return `- \`${field.key}\`: ${field.description.replace(/\|/g, '\\|')} `
    }).join('<br><br>')
  }

  authFieldsAsMarkdown(authField: Record<string, any>): string {
    const {args} = this.parse(ReadMe)
    const envPrefix = `crank_${args.cogName}`.replace(/[^a-zA-Z0-9]+/g, '_')
    const key = `${envPrefix}__${authField.key.replace(/[^a-zA-Z0-9]+/g, '_')}`.toUpperCase()
    return `| **${authField.key}** | \`${key}\` | ${authField.description.replace(/\|/g, '\\|')} |`
  }
}
