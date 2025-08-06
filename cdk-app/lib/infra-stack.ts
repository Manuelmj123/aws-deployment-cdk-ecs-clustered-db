import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1️⃣ VPC
    const vpc = new ec2.Vpc(this, "AppVpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    // 2️⃣ Aurora MySQL Cluster
    const dbSecret = new rds.DatabaseSecret(this, "DBSecret", {
      username: "manuel",
    });

    const auroraCluster = new rds.DatabaseCluster(this, "AuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: "manuel_db",
      instances: 2,
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        vpc,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // delete DB on stack delete
    });

    // 3️⃣ Create DATABASE_URL secret
    const databaseUrlSecret = new secretsmanager.Secret(this, "DatabaseUrlSecret", {
      secretStringValue: cdk.SecretValue.unsafePlainText(
        `mysql://${dbSecret.secretValueFromJson("username")}:${dbSecret.secretValueFromJson(
          "password"
        )}@${auroraCluster.clusterEndpoint.hostname}:3306/manuel_db`
      ),
    });

    // 4️⃣ Always create ECR Repo (force unique logical ID to avoid reuse issues)
    const repo = new ecr.Repository(this, "AppRepoUnique", {
      repositoryName: "app-repo",
      removalPolicy: cdk.RemovalPolicy.DESTROY, // delete repo with stack
      imageScanOnPush: true,
    });

    // 5️⃣ ECS Cluster
    const ecsCluster = new ecs.Cluster(this, "EcsCluster", { vpc });

    // 6️⃣ Fargate Service + ALB (must have desiredCount ≥ 1 to pass validation)
    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "NextAppService",
      {
        cluster: ecsCluster,
        memoryLimitMiB: 1024,
        cpu: 512,
        desiredCount: 1, // start with 1 task
        publicLoadBalancer: true,
        listenerPort: 80, // use 80 initially, can add HTTPS later
        taskImageOptions: {
          image: ecs.ContainerImage.fromEcrRepository(repo, "latest"),
          containerPort: 3000,
          environment: { NODE_ENV: "production" },
          secrets: { DATABASE_URL: ecs.Secret.fromSecretsManager(databaseUrlSecret) },
        },
      }
    );

    // 7️⃣ Auto Scaling
    const scalableTarget = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });
    scalableTarget.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 60 });

    // 8️⃣ Outputs
    new cdk.CfnOutput(this, "LoadBalancerURL", {
      value: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
    });

    new cdk.CfnOutput(this, "ECRRepoUri", { value: repo.repositoryUri });
  }
}
