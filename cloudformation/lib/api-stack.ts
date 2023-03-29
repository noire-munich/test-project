import * as cdk from 'aws-cdk-lib'
import { InstanceClass } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)
    const vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {})

    const _cluster = new cdk.aws_rds.DatabaseCluster(this, 'PROJECT_CLUSTER', {
      engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      instanceProps: { vpc },
    })

    const _api = new cdk.aws_lambda.Function(this, 'PROJECT_LAMBDA_API', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      handler: 'graphql/graphql',
      code: undefined,
    })
  }
}
