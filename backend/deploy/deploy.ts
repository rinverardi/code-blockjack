import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function (environment: HardhatRuntimeEnvironment) {
  const { deploy } = environment.deployments;
  const { deployer } = await environment.getNamedAccounts();

  const contract = await deploy("Blockjack", { from: deployer, log: true });

  console.log(`Blockjack contract deployed at ${contract.address}`);
};

export default deployFunction;

deployFunction.id = "deploy_blockjack";
deployFunction.tags = ["Blockjack"];
