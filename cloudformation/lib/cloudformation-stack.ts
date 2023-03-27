import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CloudformationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {})

    const cluster = new cdk.aws_rds.DatabaseCluster(this, 'PROJECT_CLUSTER', {
      engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      instanceProps: { vpc },
    })

    const artifact = new cdk.aws_codeartifact.CfnRepository(
      this,
      'PROJECT_ARTIFACT',
      {}
    )

    const pipeline = new cdk.aws_codepipeline.Pipeline(
      this,
      'PROJECT_PIPELINEPROJECT',
      {
        artifactBucket: new cdk.aws_s3.Bucket(this, 'PROJECT_ARTIFACTS', {
          autoDeleteObjects: true,
          versioned: true,
          blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
          bucketName: 'PROJECT_ARTIFACTS',
        }),
        crossAccountKeys:
          false /** @manual Default is true which costs $1/month as it enables a KMS. */,
        stages: [
          {
            stageName: 'build',
            actions: [
              {
                actionProperties: {
                  actionName: '',
                  artifactBounds: {},
                  category: cdk.aws_codepipeline.ActionCategory.BUILD,
                  provider: '',
                },
              },
            ],
          },
        ],
      }
    )
  }
}
