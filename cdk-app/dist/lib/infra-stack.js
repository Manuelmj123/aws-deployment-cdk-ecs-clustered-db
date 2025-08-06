"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const ecsPatterns = __importStar(require("aws-cdk-lib/aws-ecs-patterns"));
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
class InfraStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            secretStringValue: cdk.SecretValue.unsafePlainText(`mysql://${dbSecret.secretValueFromJson("username")}:${dbSecret.secretValueFromJson("password")}@${auroraCluster.clusterEndpoint.hostname}:3306/manuel_db`),
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
        const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "NextAppService", {
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
        });
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
exports.InfraStack = InfraStack;
