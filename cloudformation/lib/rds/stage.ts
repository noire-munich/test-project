import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { RdsStack } from './stack'

export class RdsStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props)

    const _rds = new RdsStack(this, 'RDSStack')
  }
}
