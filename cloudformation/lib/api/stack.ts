import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

type Lambdas = {
  [index in 'api']: cdk.aws_lambda.Function
}

export class ApiStack extends cdk.Stack {
  cluster: cdk.aws_rds.DatabaseCluster

  lambdas: Partial<Lambdas> = { api: undefined }

  vpc: cdk.aws_ec2.Vpc

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {})

    this.lambdas.api = new cdk.aws_lambda.Function(this, 'PROJECT_LAMBDA_API', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      handler: 'handler/handler',
      code: cdk.aws_lambda.Code.fromInline(
        'exports.handler=()=> "here worled"'
      ),
    })
  }
}
