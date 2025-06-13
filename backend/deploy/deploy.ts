import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function (environment: HardhatRuntimeEnvironment) {
  const { deploy } = environment.deployments;
  const { deployer } = await environment.getNamedAccounts();

  // Deploy the game.

  const naiveBlockjack = await deploy("NaiveBlockjack", { from: deployer });

  console.log(`Blockjack contract (naive prototype) deployed at ${naiveBlockjack.address}.`);

  // Deploy the demo.

  const homomorphicArithmetic = await deploy("HomomorphicArithmetic", { from: deployer });

  console.log(`Demo contract (homomorphic arithmetic) deployed at ${homomorphicArithmetic.address}.`);

  const homomorphicEncryption = await deploy("HomomorphicEncryption", { from: deployer });

  console.log(`Demo contract (homomorphic encryption) deployed at ${homomorphicEncryption.address}.`);
};

export default deployFunction;

deployFunction.id = "deploy_blockjack";
deployFunction.tags = ["Blockjack"];
