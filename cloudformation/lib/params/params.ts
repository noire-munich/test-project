import * as fs from 'fs'
import * as path from 'path'

import * as cdk from 'aws-cdk-lib'
import * as dotenv from 'dotenv'
import * as toml from 'toml'

import { getPaths } from '@redwoodjs/internal'

/**
 * Source params from local sources.
 */
export const source = () => {}

abstract class EnvVariableWorker<T> {
  cachePath = path.join(
    getPaths().base,
    'cloudformation',
    '.environmentVariables.json'
  )

  abstract all: T

  abstract api: T

  abstract web: T

  readFromCache() {
    return JSON.parse(fs.readFileSync(this.cachePath).toString())
  }
}

/**
 * Return variable keys from local sources:
 * - api as defined in .env file
 * - web as defined in redwood.toml file.
 */
export class Source extends EnvVariableWorker<string[]> {
  #all: string[]

  #api: string[]

  #web: string[]

  constructor() {
    super()
    this.#all = []
    this.#api = []
    this.#web = []
  }

  get all(): string[] {
    if (!this.#all.length) {
      try {
        const variables = this.readFromCache()

        this.#all = [...variables.api, ...variables.data.web]

        console.log(`We read cache from ${this.cachePath}`)
      } catch {
        this.#all = [...Readers.dotenv(), ...Readers.toml()]

        this.writeToCache()

        console.log(`We created a cache at ${this.cachePath}`)
      }
    }

    return this.#all
  }

  get api(): string[] {
    if (!this.#api.length) {
      this.#api = Readers.dotenv()
    }

    return this.#api
  }

  get web(): string[] {
    if (!this.#web.length) {
      this.#web = Readers.toml()
    }

    return this.#web
  }

  public writeToCache() {
    const body = {
      api: this.api,
      web: this.web,
    }

    fs.writeFileSync(this.cachePath, JSON.stringify(body))
  }
}

/**
 * Fetch params from AWS.
 */
type FetchOutput = {
  [index: string]: cdk.aws_codebuild.BuildEnvironmentVariable
}

export class Fetch extends EnvVariableWorker<FetchOutput> {
  #prefix: string

  constructor(prefix: string) {
    super()
    this.#prefix = prefix
  }

  get all(): FetchOutput {
    const cache = this.readFromCache()

    const keys = [...cache.api, ...cache.web]

    const variables = keys.reduce((Q, key) => {
      const variableType = /_SECRET$/.test(key)
        ? cdk.aws_codebuild.BuildEnvironmentVariableType.SECRETS_MANAGER
        : cdk.aws_codebuild.BuildEnvironmentVariableType.PARAMETER_STORE

      return {
        ...Q,
        [key]: { type: variableType, value: `/${this.#prefix}/${key}` },
      }
    }, {})

    return variables
  }

  get api(): FetchOutput {
    return {}
  }

  get web(): FetchOutput {
    return {}
  }
}

/**
 * Readers for local sources only.
 */
const Readers = {
  dotenv(): string[] {
    return ['.env.sample', '.env'].reduceRight<string[]>((Q, file) => {
      if (Q.length > 0) return Q

      try {
        return Object.keys(
          dotenv.parse(
            Buffer.from(fs.readFileSync(path.join(getPaths().base, file)))
          )
        )
      } catch {
        return Q
      }
    }, [])
    return Object.keys(
      dotenv.parse(
        Buffer.from(fs.readFileSync(path.join(getPaths().base, '.env')))
      )
    )
  },
  toml(): string[] {
    return toml.parse(
      fs.readFileSync(path.join(getPaths().base, 'redwood.toml')).toString()
    ).web.includeEnvironmentVariables
  },
}
