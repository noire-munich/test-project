import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

type Lambdas = {
  [index in 'api']: cdk.aws_lambda.Function
}

export const ID_DATABASE_CREDENTIALS_SECRET = 'DATABASE_CREDENTIALS_SECRET'

export const ID_DATABASE_CREDENTIALS = 'DATABASE_CREDENTIALS'

const allowedStorageSizes = { entry: { default: 10, max: 25 } }

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

export const databaseName = 'db_project'

export class RdsStack extends cdk.Stack {
  cluster: cdk.aws_rds.DatabaseCluster

  connectionString: cdk.aws_ssm.StringParameter

  // credentials: cdk.aws_secretsmanager.SecretTargetAttachment

  database: cdk.aws_rds.DatabaseInstance

  lambdas: Lambdas

  testDatabase: cdk.aws_rds.DatabaseInstance

  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps & { vpc: cdk.aws_ec2.Vpc }
  ) {
    super(scope, id, props)

    if (!props?.vpc) {
      throw new Error('VPC is expected as a prop.')
    }

    // Create a database with user and db name
    // Create a test database with a user and db name
    // --> check if possible to add one more database to an instance

    this.database = new cdk.aws_rds.DatabaseInstance(this, 'PROJECT_DATABASE', {
      engine: cdk.aws_rds.DatabaseInstanceEngine.POSTGRES,
      instanceType: cdk.aws_ec2.InstanceType.of(
        allowedEngines.entry[0].InstanceClass,
        allowedEngines.entry[0].InstanceSize
      ),
      databaseName: databaseName,
      /** @manual multiAz support generates more costs as it will create NAT Gateways. */
      multiAz: false,
      /** @manual maxAllocatedStorage This sets the upper limit for autoscaling. Disabled as default = no autoscaling.  */
      // maxAllocatedStorage: allowedStorageSizes.entry.max,
      vpc: props.vpc,
    })

    const credentials = new cdk.aws_secretsmanager.SecretTargetAttachment(
      this,
      ID_DATABASE_CREDENTIALS,
      {
        secret: new cdk.aws_secretsmanager.Secret(
          this,
          ID_DATABASE_CREDENTIALS_SECRET,
          {
            secretName: '/project/DB_CREDENTIALS',
            secretObjectValue: {
              database: cdk.SecretValue.unsafePlainText(databaseName),
              username: cdk.SecretValue.unsafePlainText('admin'),
              password: cdk.SecretValue.unsafePlainText('project'),
            },
          }
        ),
        target: this.database,
      }
    )

    const connectionString = `postgres://admin:${credentials
      .secretValueFromJson('password')
      .unsafeUnwrap()}@${this.database.dbInstanceEndpointAddress}:${
      this.database.dbInstanceEndpointPort
    }/${databaseName}`

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
const auroraCluster = (scope: RdsStack, vpc: cdk.aws_ec2.Vpc): void => {
  scope.cluster = new cdk.aws_rds.DatabaseCluster(scope, 'PROJECT_CLUSTER', {
    engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
      version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_14_6,
    }),
    // engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
    instances: 2,
    instanceProps: {
      vpc,
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
    ID_DATABASE_CREDENTIALS,
    {
      secret: new cdk.aws_secretsmanager.Secret(
        scope,
        ID_DATABASE_CREDENTIALS_SECRET,
        {
          secretName: '/project/DATABASE_URL',
        }
      ),
      target: scope.cluster,
    }
  )
}
