import * as cdk from 'aws-cdk-lib'
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines'

import { Construct } from 'constructs'

const repoName
 = 'test-project'

const repoBranch = 'main'

const repoOwner = 'noire-munich'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CloudformationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('noire-munich/test-project', 'main'),
        commands: ['ls -la', 'yarn'],
      }),
    })
  }
}
export class _CloudformationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // const vpc = new cdk.aws_ec2.Vpc(this, 'PROJECT_VPC', {
    //   ipAddresses: cdk.aws_ec2.IpAddresses.cidr('10.0.0.0/16'),
    // })

    // const cluster = new cdk.aws_rds.DatabaseCluster(this, 'PROJECT_CLUSTER', {
    //   engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
    //   instanceProps: { vpc },
    // })

    const pipelineArtifact = new cdk.aws_codepipeline.Artifact(
      'PROJECT_ARTIFACT'
    )

    // const executionRole = new cdk.aws_iam.Role(
    //   this,
    //   'PROJECT_CLOUDFORMATION_ROLE',
    //   {
    //     roleName: 'PROJECT_CLOUDFORMATION_ROLE',
    //     assumedBy: new cdk.aws_iam.ServicePrincipal(
    //       'codepipeline.amazonaws.com'
    //     ),
    //   }
    // )

    const pipeline = new cdk.aws_codepipeline.Pipeline(
      this,
      'PROJECT_PIPELINE',
      {
        // role: executionRole,
        pipelineName: 'PROJECT_DELIVER',
        crossAccountKeys:
          false /** @manual Default is true which costs $1/month as it enables a KMS. */,
        stages: [
          {
            stageName: 'Source',
            actions: [
              new cdk.aws_codepipeline_actions.GitHubSourceAction({
                actionName: 'ACTION_SOURCE',
                repo: repoName,
                branch: repoBranch,
                owner: repoOwner,
                output: pipelineArtifact,
                oauthToken: cdk.SecretValue.secretsManager(
                  'noire-munich/test_project/repo	'
                ),
              }),
            ],
          },
          {
            stageName: 'Test',
            actions: [
              new cdk.aws_codepipeline_actions.CodeBuildAction({
                actionName: 'ACTION_TEST',
                type: cdk.aws_codepipeline_actions.CodeBuildActionType.TEST,
                input: pipelineArtifact,
                // role: executionRole,
                project: new cdk.aws_codebuild.Project(this, 'PROJECT_TEST', {
                  buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                      build: {
                        commands: [
                          'yarn install',
                          // 'yarn rw test api',
                          // 'yarn rw test web',
                        ],
                      },
                    },
                  }),
                  // environmentVariables: {},/** @manual We get the project's variables from infer/prompt/file */
                  environment: {
                    buildImage:
                      cdk.aws_codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
                  },
                }),
              }),
            ],
          },
          // {
          //   stageName: 'Deploy',
          //   actions: [
          //     new cdk.aws_codepipeline_actions.CodeBuildAction({
          //       actionName: 'ACTION_BUILD',
          //       type: cdk.aws_codepipeline_actions.CodeBuildActionType.BUILD,
          //       // role: executionRole,
          //       project: new cdk.aws_codebuild.Project(this, 'PROJECT_BUILD', {
          //         buildSpec: cdk.aws_codebuild.BuildSpec.fromObject({
          //           version: '0.2',
          //           phases: {
          //             build: {
          //               commands: ['yarn rw build api'],
          //             },
          //           },
          //         }),
          //         // environmentVariables: {},/** @manual We get the project's variables from infer/prompt/file */
          //         environment: {
          //           buildImage:
          //             cdk.aws_codebuild.LinuxBuildImage.AMAZON_LINUX_2_4,
          //         },
          //       }),
          //       input: pipelineArtifact,
          //     }),
          //   ],
          // },
        ],
      }
    )

    // const gateway = new cdk.aws_apigateway.LambdaRestApi(
    //   this,
    //   'PROJECT_WEB_GATEWAY',
    //   {
    //     restApiName: 'PROJECT_WEB_GATEWAY',
    //     handler: new cdk.aws_lambda.Function(this, 'PROJECT_WEB_LAMBDA', {
    //       code: undefined,
    //     }),
    //   }
    // )
  }
}
