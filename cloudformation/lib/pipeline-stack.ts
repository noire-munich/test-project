import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { Fetch } from './params/params'
import { databaseName } from './rds/stack'

const repoBranch = 'main'

const repoOwner = 'noire-munich'

const repoName = 'test-project'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & {
      database: cdk.aws_rds.DatabaseInstance
      vpc: cdk.aws_ec2.Vpc
    }
  ) {
    super(scope, id, props)

    const pipeline = new cdk.aws_codepipeline.Pipeline(this, 'PIPELINE', {
      restartExecutionOnUpdate: true,
    })

    // TEST_DATABASE_URL=file:./.redwood/test.db
    // const _testDatabaseUrl = new cdk.aws_ssm.StringParameter(
    //   this,
    //   'TEST_DATABASE_URL',
    //   {
    //     parameterName: 'TEST_DATABASE_URL',
    //     stringValue: 'file:./.redwood/test.db',
    //   }
    // )

    pipeline.artifactBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

    const sourceArtifact = new cdk.aws_codepipeline.Artifact('SOURCE')

    const actionSource =
      new cdk.aws_codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: 'pull-source',
        connectionArn:
          'arn:aws:codestar-connections:us-east-1:246406737889:connection/bc87cd9a-7175-4de9-9b86-c443b3bf49fe',
        repo: repoName,
        owner: repoOwner,
        branch: repoBranch,
        output: sourceArtifact,
      })

    pipeline.addStage({
      stageName: 'SOURCE',
      actions: [actionSource],
    })

    const variables = new Fetch('project').all

    const buildProject = new cdk.aws_codebuild.PipelineProject(this, 'BUILD', {
      vpc: props?.vpc,
      role: cdk.aws_iam.Role.fromRoleArn(
        this,
        'BuildRole',
        'arn:aws:iam::246406737889:role/Pipeline'
      ),
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['yarn install'],
          },
          pre_build: {
            commands: [
              'yarn rw exec variables && exit',
              // 'yarn rw test --watch=false', /** @todo Reactivate those. */
            ],
          },
          build: {
            commands: [
              'yarn rw prisma migrate dev',
              'yarn rw build',
              'yarn zip-it-and-ship-it dist/functions zipballs/',
            ],
          },
        },
        cache: { paths: '/root/.cache/yarn/**/*' },
        artifacts: {
          files: 'zipballs/*',
        },
      }),
      environmentVariables: {
        /** @manual We get the project's variables from infer/prompt/file */
        ...variables,
      },
      environment: {
        buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
        privileged: true,
      },
    })

    buildProject.connections.allowToDefaultPort(props.database)

    const buildArtifact = new cdk.aws_codepipeline.Artifact('BUILD')

    const actionBuild = new cdk.aws_codepipeline_actions.CodeBuildAction({
      actionName: 'build-from-source',
      // input: installedArtifact,
      input: sourceArtifact,
      outputs: [buildArtifact],
      project: buildProject,
    })

    pipeline.addStage({
      stageName: 'BUILD',
      actions: [actionBuild],
    })
  }
}
