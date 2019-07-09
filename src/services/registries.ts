import * as fs from 'fs'
import * as path from 'path'

import {CogConfig} from './cog-manager'

export interface CogRegistryEntry {
  name?: string
  version?: string
  stepDefinitionsList?: any[]
  authFieldsList?: any[]
  _runConfig?: CogConfig
}

export interface StepRegistryEntry {
  stepId: string
  name: string
  expression: string
  expectedFieldsList: any[]
  _cog: string
}

export interface AuthRegistryEntry {
  cog: string
  auth: any
}

export class Registries {
  private static instance: Registries

  protected cacheDir: string
  protected stepRegistry: StepRegistryEntry[] = []
  protected cogRegistry: CogRegistryEntry[] = []
  private authRegistry: AuthRegistryEntry[] = []

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir

    if (Registries.instance) {
      return Registries.instance
    }

    Registries.instance = this
  }

  public buildStepRegistry(): StepRegistryEntry[] {
    if (this.stepRegistry.length > 0) {
      return this.stepRegistry
    }

    const cogRegistry = this.buildCogRegistry()
    const stepsNested = cogRegistry.map((cog: any) => {
      return cog.stepDefinitionsList.map((def: any) => {
        def._cog = cog.name
        return def
      })
    })

    if (stepsNested.length > 0) {
      this.stepRegistry = stepsNested.reduce((acc, val) => acc.concat(val))
    }

    return this.stepRegistry
  }

  public addToCogRegistry(registryEntry: CogRegistryEntry, force = false): void {
    const registry = this.buildCogRegistry()
    let toBeSpliced = -1

    const existingEntry = registry.filter((entry: CogRegistryEntry, index: number) => {
      if (entry.name === registryEntry.name) {
        toBeSpliced = index
        return true
      }
      return false
    })

    if (existingEntry.length > 0) {
      if (!force) {
        throw new Error(`Cog named ${registryEntry.name} is already installed.`)
      } else if (toBeSpliced !== -1) {
        registry.splice(toBeSpliced, 1)
      }
    }

    registry.push(registryEntry)
    fs.writeFileSync(path.join(this.cacheDir, 'cog-registry.json'), JSON.stringify(registry))
    this.cogRegistry = registry
  }

  public removeCogFromRegistry(name: string): void {
    const registry = this.buildCogRegistry()
    let toBeSpliced = -1

    const existingEntry = registry.filter((entry: CogRegistryEntry, index: number) => {
      if (entry.name === name) {
        toBeSpliced = index
        return true
      }
      return false
    })

    if (existingEntry.length > 0 && toBeSpliced !== -1) {
      registry.splice(toBeSpliced, 1)
    }

    this.cogRegistry = registry
    fs.writeFileSync(path.join(this.cacheDir, '/cog-registry.json'), JSON.stringify(registry))
  }

  public buildCogRegistry(): CogRegistryEntry[] {
    if (this.cogRegistry.length > 0) {
      return this.cogRegistry
    }

    try {
      this.cogRegistry = JSON.parse(fs.readFileSync(path.join(this.cacheDir, 'cog-registry.json')).toString('utf8'))
    } catch (e) {
      return e ? [] : []
    }

    return this.cogRegistry
  }

  public getCogConfigFromRegistry(cogName: string): CogRegistryEntry | undefined {
    const registry = this.buildCogRegistry()

    const filteredReg: CogRegistryEntry[] = registry.filter((cogEntry: CogRegistryEntry) => {
      return cogEntry.name === cogName
    })

    return filteredReg.length === 1 ? filteredReg[0] : undefined
  }

  public buildAuthRegistry(): AuthRegistryEntry[] {
    if (this.authRegistry.length > 0) {
      return this.authRegistry
    }

    try {
      this.authRegistry = JSON.parse(fs.readFileSync(path.join(this.cacheDir, 'default-profile.json')).toString('utf8'))
    } catch (e) {
      return e ? [] : []
    }

    return this.authRegistry
  }

  public addAuthRegistryEntry(authEntry: AuthRegistryEntry): void {
    const registry = this.buildAuthRegistry()
    let toBeSpliced = -1

    const existingEntry = registry.filter((entry: AuthRegistryEntry, index: number) => {
      if (entry.cog === authEntry.cog) {
        toBeSpliced = index
        return true
      }
      return false
    })

    if (existingEntry.length > 0 && toBeSpliced !== -1) {
      registry.splice(toBeSpliced, 1)
    }

    registry.push(authEntry)
    this.authRegistry = registry
    fs.writeFileSync(path.join(this.cacheDir, 'default-profile.json'), JSON.stringify(registry))
  }

  public removeAuthFromRegistry(cog: string): void {
    const registry = this.buildAuthRegistry()
    let toBeSpliced = -1

    const existingEntry = registry.filter((entry: AuthRegistryEntry, index: number) => {
      if (entry.cog === cog) {
        toBeSpliced = index
        return true
      }
      return false
    })

    if (existingEntry.length > 0 && toBeSpliced !== -1) {
      registry.splice(toBeSpliced, 1)
    }

    this.authRegistry = registry
    fs.writeFileSync(path.join(this.cacheDir, 'default-profile.json'), JSON.stringify(registry))
  }

}
