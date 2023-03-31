import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

type Lambdas = {
  [index in 'api']: cdk.aws_lambda.Function
}

export const CredentialsSecretId = 'DATABASE_CREDENTIALS_SECRET'

export const CredentialsSecretAttachmentId = 'DATABASE_CREDENTIALS'

export class RdsStack extends cdk.Stack {
  cluster: cdk.aws_rds.DatabaseCluster

  lambdas: Lambdas

  vpc: cdk.aws_ec2.Vpc

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {})

    this.cluster = new cdk.aws_rds.DatabaseCluster(this, 'PROJECT_CLUSTER', {
      engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
        version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      // engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      instances: 2,
      instanceProps: {
        vpc: this.vpc,
        deleteAutomatedBackups: true,
        // parameterGroup: cdk.aws_rds.ParameterGroup.fromParameterGroupName(
        //   this,
        //   'ParameterGroup',
        //   'default.aurora-postgresql14'
        // ),
      },
      defaultDatabaseName: 'project',
      // parameterGroup: cdk.aws_rds.ParameterGroup.fromParameterGroupName(
      //   this,
      //   'ParameterGroup',
      //   'default.aurora-postgresql14'
      // ),
    })

    const _db_credentials = new cdk.aws_secretsmanager.SecretTargetAttachment(
      this,
      CredentialsSecretAttachmentId,
      {
        secret: new cdk.aws_secretsmanager.Secret(this, CredentialsSecretId, {
          secretName: '/project/DATABASE_URL',
        }),
        target: this.cluster,
      }
    )
  }
}
