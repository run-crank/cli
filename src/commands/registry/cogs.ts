import {cli} from 'cli-ux'

import RegistryAwareCommand from '../../registry-aware-command'

export class Cogs extends RegistryAwareCommand {
  static description = 'List Cogs that are currently installed on this machine'
  static examples = [
    '$ crank registry:cogs',
    '$ crank registry:cogs --extended --no-truncate'
  ]

  static flags = {
    ...cli.table.flags()
  }

  async run() {
    const {flags} = this.parse(Cogs)
    flags.sort = flags.sort || 'name'
    const registry = this.registry.buildCogRegistry()

    cli.table(registry, {
      name: {
        minWidth: 30,
      },
      version: {},
      type: {
        get: row => row._runConfig && row._runConfig.strategy
      },
      stepCount: {
        header: 'Steps',
        get: row => row.stepDefinitionsList && row.stepDefinitionsList.length,
        extended: true
      },
      authFields: {
        header: 'Auth Fields',
        get: row => row.authFieldsList && row.authFieldsList.map(field => field.key).join('\n'),
        extended: true
      },
      startCmd: {
        header: 'Start Command',
        extended: true,
        get: row => {
          if (row._runConfig && row._runConfig.strategy === 'docker') {
            return `docker run --rm ${row._runConfig.dockerImage}`
          } else {
            return row._runConfig ? row._runConfig.cmd : ''
          }
        }
      }
    }, {
      printLine: this.log,
      ...flags
    })
  }

}
