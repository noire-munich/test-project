import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

type Lambdas = {
  [index in 'api']: cdk.aws_lambda.Function
}

export const CredentialsSecretId = 'DATABASE_CREDENTIALS_SECRET'

export const CredentialsSecretAttachmentId = 'DATABASE_CREDENTIALS'

const allowedStorageSizes = { entry: { default: 5, max: 10 } }

const allowedEngines = {
  entry: [
    {
      InstanceClass: cdk.aws_ec2.InstanceClass.T3,
      InstanceSize: cdk.aws_ec2.InstanceSize.MICRO,
    },
    {
      /**
       * @manual T4G have better bandwitdh than T3
       * @see https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html#Concepts.DBInstanceClass.Summary
       */
      InstanceClass: cdk.aws_ec2.InstanceClass.T4G,
      InstanceSize: cdk.aws_ec2.InstanceSize.MICRO,
    },
  ],
}

const databaseName = 'db_project'
export class RdsStack extends cdk.Stack {
  cluster: cdk.aws_rds.DatabaseCluster

  connectionString: cdk.aws_ssm.StringParameter

  // credentials: cdk.aws_secretsmanager.SecretTargetAttachment

  database: cdk.aws_rds.DatabaseInstance

  lambdas: Lambdas

  vpc: cdk.aws_ec2.Vpc

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', { maxAzs: 1 })

    this.database = new cdk.aws_rds.DatabaseInstance(this, 'PROJECT_DATABASE', {
      engine: cdk.aws_rds.DatabaseInstanceEngine.POSTGRES,
      instanceType: cdk.aws_ec2.InstanceType.of(
        allowedEngines.entry[0].InstanceClass,
        allowedEngines.entry[0].InstanceSize
      ),
      databaseName: databaseName,
      /** @manual multiAz support generates more costs as it will create NAT Gateways. */
      multiAz: false,
      maxAllocatedStorage: allowedStorageSizes.entry.default,
      vpc: this.vpc,
    })

    const credentials = new cdk.aws_secretsmanager.SecretTargetAttachment(
      this,
      CredentialsSecretAttachmentId,
      {
        secret: new cdk.aws_secretsmanager.Secret(this, CredentialsSecretId, {
          secretName: '/project/DB_CREDENTIALS',
        }),
        target: this.database,
      }
    )

    const connectionString = `postgres://admin:${credentials.secretValue.unsafeUnwrap()}@${
      this.database.dbInstanceEndpointAddress
    }:${this.database.dbInstanceEndpointPort}/${databaseName}`

    this.connectionString = new cdk.aws_ssm.StringParameter(
      this,
      'project/DATABASE_URL',
      {
        stringValue: connectionString,
        parameterName: '/project/DATABASE_URL',
      }
    )
  }
}

/**
 * This stack is reserved to company projects.
 * The costs it will trigger are not negligeble and should be controlled
 * on a daily basis.
 *
 * @param scope
 */
const auroraCluster = (scope: RdsStack): void => {
  scope.vpc = new cdk.aws_ec2.Vpc(scope, 'PROJECT_VPC', {})

  scope.cluster = new cdk.aws_rds.DatabaseCluster(scope, 'PROJECT_CLUSTER', {
    engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
      version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_14_6,
    }),
    // engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
    instances: 2,
    instanceProps: {
      vpc: scope.vpc,
      deleteAutomatedBackups: true,
      // parameterGroup: cdk.aws_rds.ParameterGroup.fromParameterGroupName(
      //   scope,
      //   'ParameterGroup',
      //   'default.aurora-postgresql14'
      // ),
    },
    defaultDatabaseName: 'project',
    // parameterGroup: cdk.aws_rds.ParameterGroup.fromParameterGroupName(
    //   scope,
    //   'ParameterGroup',
    //   'default.aurora-postgresql14'
    // ),
  })

  const _db_credentials = new cdk.aws_secretsmanager.SecretTargetAttachment(
    scope,
    CredentialsSecretAttachmentId,
    {
      secret: new cdk.aws_secretsmanager.Secret(scope, CredentialsSecretId, {
        secretName: '/project/DATABASE_URL',
      }),
      target: scope.cluster,
    }
  )
}
