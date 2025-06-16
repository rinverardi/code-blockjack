import { getInstance } from "../fhevmjs";
import { Contract } from "ethers";

export function decorateContract<T extends Contract>(contract: T, contractName: string): T {
  return new Proxy(contract, {
    get(_, propertyName) {
      const propertyValue = Reflect.get(contract, propertyName);

      if (typeof propertyValue !== "function") {
        return propertyValue;
      } else {
        const contractFunction = propertyName.toString() + "()";

        return async (...inputs: any[]) => {
          const output = await propertyValue.apply(contract, inputs);

          await delay(contractFunction, contractName, output && typeof output.wait === "function" ? 4000 : 1000);

          return output;
        };
      }
    },
  });
}

export function decorateInstance() {
  const instance = getInstance();

  return new Proxy(instance, {
    get(_, propertyName) {
      const propertyValue = Reflect.get(instance, propertyName);

      if (typeof propertyValue !== "function") {
        return propertyValue;
      } else if (propertyValue.constructor.name !== "AsyncFunction") {
        return propertyValue.bind(instance);
      } else {
        const instanceFunction = propertyName.toString() + "()";

        return async (...inputs: any[]) => {
          const output = await propertyValue.apply(instance, inputs);

          await delay(instanceFunction, "instance", 4000);

          return output;
        };
      }
    },
  });
}

function delay(target: string, targetFunction: string, maxDuration: number) {
  const randomDuration = Math.round(Math.random() * maxDuration);

  console.log(`⌛️ Delaying ${targetFunction}.${target} for ${randomDuration} ms.`);

  return new Promise((resolve) => setTimeout(resolve, randomDuration));
}

export function wrapContract<T extends Contract>(contract: T, contractName: string): T {
  return import.meta.env.MOCKED ? decorateContract(contract, contractName) : contract;
}

export function wrapInstance() {
  return import.meta.env.MOCKED ? decorateInstance() : getInstance();
}
