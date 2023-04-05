#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'

import { PipelineStack } from '../lib/pipeline-stack'
import { RdsStack } from '../lib/rds/stack'
import { VpcStack } from '../lib/vpc/stack'

const app = new cdk.App()

const defaultProps = {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
}

const vpcStack = new VpcStack(app, 'VPC', {
  ...defaultProps,
  stackName: 'VPCStack',
})

const rdsStack = new RdsStack(app, 'RDS', {
  ...defaultProps,
  stackName: 'RDSSTACK',
  vpc: vpcStack.vpc,
})

const _pipeline = new PipelineStack(app, 'Pipeline', {
  ...defaultProps,
  stackName: 'PipelineStack',
  database: rdsStack.database,
  vpc: vpcStack.vpc,
})
