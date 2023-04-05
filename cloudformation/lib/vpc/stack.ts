import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class VpcStack extends cdk.Stack {
  vpc: cdk.aws_ec2.Vpc

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {
      maxAzs: 2,
      natGateways: 1,
    })
  }
}
