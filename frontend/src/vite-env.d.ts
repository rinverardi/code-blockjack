/// <reference types="vite/client" />

interface Window {
  ethereum: import("ethers").Eip1193Provider & {
    on: (event: string, listener: (param: any) => any) => void;
  };
}
