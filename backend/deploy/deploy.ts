import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function (environment: HardhatRuntimeEnvironment) {
  const { deploy } = environment.deployments;
  const { deployer } = await environment.getNamedAccounts();

  for (const contract of [
    "HomomorphicArithmetic",
    "HomomorphicEncryption",
    "NaiveBlockjack",
    "NaiveBlockjackForMeasurements",
    "SecureBlockjack",
    "SecureBlockjackForMeasurements",
  ]) {
    await deploy(contract, { from: deployer, log: true });
  }
};

export default deployFunction;
