import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function (environment: HardhatRuntimeEnvironment) {
  const { deploy } = environment.deployments;
  const { deployer } = await environment.getNamedAccounts();

  const blockjack = await deploy("Blockjack", { from: deployer });

  console.log(`Blockjack contract deployed at ${blockjack.address}.`);

  const homomorphicArithmetic = await deploy("HomomorphicArithmetic", { from: deployer });

  console.log(`Demo contract for homomorphic arithmetic deployed at ${homomorphicArithmetic.address}.`);

  const homomorphicEncryption = await deploy("HomomorphicEncryption", { from: deployer });

  console.log(`Demo contract for homomorphic encryption deployed at ${homomorphicEncryption.address}.`);
};

export default deployFunction;

deployFunction.id = "deploy_blockjack";
deployFunction.tags = ["Blockjack"];
