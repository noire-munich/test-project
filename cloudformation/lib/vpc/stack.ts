import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class VpcStack extends cdk.Stack {
  vpc: cdk.aws_ec2.Vpc

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {
      maxAzs: 2,
      natGateways: 1,
      /** @manual This VPC requires input from the internet to install packages & sources. */
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          /** @manual Allows CodeBuild to fetch sources & packages. */
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    })
  }
}
