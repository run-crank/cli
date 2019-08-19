import {cli} from 'cli-ux'

import RegistryAwareCommand from '../../registry-aware-command'

export class Steps extends RegistryAwareCommand {
  static description = 'List steps that are currently available on this machine'
  static examples = [
    '$ crank registry:steps',
    '$ crank registry:steps --extended --no-truncate'
  ]

  static flags = {
    ...cli.table.flags()
  }

  async run() {
    const {flags} = this.parse(Steps)
    flags.sort = flags.sort || flags.extended ? 'cog' : 'system'
    const registry = this.registry.buildStepRegistry()

    cli.table(registry, {
      _cogLabel: {
        header: 'System'
      },
      expression: {
        minWidth: 50,
      },
      type: {
        get: row => row.type === 0 ? 'Action' : 'Validation',
        extended: true,
      },
      _cog: {
        header: 'Cog',
        extended: true,
      },
      name: {
        header: 'Step',
        extended: true
      },
      stepId: {
        header: 'ID',
        extended: true,
      },
      expectedFieldsList: {
        header: 'Expected Fields',
        extended: true,
        get: row => row.expectedFieldsList && row.expectedFieldsList.map(f => f.key).join('\n')
      },
    }, {
      printLine: this.log,
      ...flags
    })
  }

}
