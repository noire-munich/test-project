import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { ApiStack } from './stack'

export class ApiStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    const _api = new ApiStack(this, 'ApiStack')
  }
}
