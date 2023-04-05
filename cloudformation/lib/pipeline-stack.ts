import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { ApiStage } from './api/stage'
import { Fetch } from './params/params'
import { RdsStack } from './rds/stack'
import { RdsStage } from './rds/stage'
import { log } from 'console'

const repoBranch = 'main'

const repoOwner = 'noire-munich'

const repoName = 'test-project'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const rdsStack = new RdsStack(this, 'RDS')

    const pipeline = new cdk.aws_codepipeline.Pipeline(this, 'PIPELINE', {
      pipelineName: 'PROJECTNAME',
      restartExecutionOnUpdate: true,
    })

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
      role: cdk.aws_iam.Role.fromRoleArn(
        this,
        'BuildRole',
        'arn:aws:iam::246406737889:role/Pipeline'
      ),
      buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: { commands: 'yarn install' },
          pre_build: {
            commands: [
              'yarn rw exec variables && exit',
              'yarn rw test --watch=false',
            ],
          },
          build: {
            commands: [
              'yarn rw prisma migrate dev',
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

    // pipeline.addStage(new RdsStage(this, 'RDSStage', { stageName: 'RDSStage' }))

    // pipeline.addStage(new ApiStage(this, 'ApiStage', { stageName: 'APIStage' }))
  }
}
