import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

const repoBranch = 'main'

const repoOwner = 'noire-munich'

const repoName = 'test-project'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const pipeline = new cdk.aws_codepipeline.Pipeline(
      this,
      'PROJECT_NAME__PIPELINE',
      {
        pipelineName: 'PROJECT_NAME',
        restartExecutionOnUpdate: true,
      }
    )

    pipeline.artifactBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

    const sourceArtifact = new cdk.aws_codepipeline.Artifact(
      'PROJECT_ARTIFACT_SOURCE'
    )

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
      stageName: 'PROJECT_NAME__SOURCE_STAGE',
      actions: [actionSource],
    })

    const installedArtifact = new cdk.aws_codepipeline.Artifact(
      'PROJECT_NAME__SOURCE'
    )

    const installProject = new cdk.aws_codebuild.PipelineProject(
      this,
      'PROJECT_NAME__INSTALL',
      {
        buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            build: {
              commands: [
                'yarn install',
                'yarn rw exec checkenv > .checkenv.out.yaml',
              ],
            },
          },
        }),
        // environmentVariables: {},/** @manual We get the project's variables from infer/prompt/file */
        environment: {
          buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
          privileged: true,
        },
      }
    )

    const actionInstall = new cdk.aws_codepipeline_actions.CodeBuildAction({
      actionName: 'install-packages',
      input: sourceArtifact,
      outputs: [installedArtifact],
      project: installProject,
    })

    const testProject = new cdk.aws_codebuild.PipelineProject(
      this,
      'PROJECT_NAME__TEST',
      {
        buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            build: {
              commands: ['yarn rw test api && yarn rw test web'],
            },
          },
        }),
        // environmentVariables: {},/** @manual We get the project's variables from infer/prompt/file */
        environment: {
          buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
          privileged: true,
        },
      }
    )

    const actionTest = new cdk.aws_codepipeline_actions.CodeBuildAction({
      actionName: 'test-project',
      input: installedArtifact,
      project: testProject,
    })

    const buildProject = new cdk.aws_codebuild.PipelineProject(
      this,
      'PROJECT_NAME__BUILD',
      {
        buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            build: {
              commands: [
                'yarn rw prisma migrate dev',
                'yarn build api',
                'yarn build web',
              ],
            },
          },
        }),
        // environmentVariables: {},/** @manual We get the project's variables from infer/prompt/file */
        environment: {
          buildImage: cdk.aws_codebuild.LinuxBuildImage.STANDARD_6_0,
          privileged: true,
        },
      }
    )

    const buildArtifact = new cdk.aws_codepipeline.Artifact('BUILD_ARTIFACT')

    const actionBuild = new cdk.aws_codepipeline_actions.CodeBuildAction({
      actionName: 'build-from-source',
      input: installedArtifact,
      outputs: [buildArtifact],
      project: buildProject,
    })

    pipeline.addStage({
      stageName: 'PROJECT_NAME__BUILD_STAGE',
      actions: [actionInstall, actionTest, actionBuild],
    })
  }
}
