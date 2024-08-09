import { useEffect, useState } from "react";
import { MainContract } from "../contracts/MainContract";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { Address, OpenedContract, toNano } from "ton-core";
import { useTonConnect } from "./useTonConnect";

export function useMainContract() {
  const client = useTonClient();
  const { sender } = useTonConnect();

  const sleep = (time: number) =>
    new Promise((resolve) => setTimeout(resolve, time));

  const [contractData, setContractData] = useState<null | {
    counter_value: Number;
    recent_sender: Address;
    owner_address: Address;
  }>();
  
  const [balance, setBalance] = useState<null | number>(0);

  const mainContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new MainContract(
      Address.parse("kQDSxwRDCReuK9-G8n9tu2TsiI49rSb_XFfz1GtR99knq9aL")
    );
    return client.open(contract) as OpenedContract<MainContract>;
  }, [client]);

  useEffect(() => {
    async function getValue() {
      if (!mainContract) return;
      const val = await mainContract.getData();
      const balance = await mainContract.getBalance();
      setContractData({
        counter_value: val.number,
        recent_sender: val.recent_sender,
        owner_address: val.owner_address,
      });
      setBalance(balance.balance);
      await sleep(5000);
      getValue();
    }
    getValue();
  }, [mainContract]);

  return {
    contract_address: mainContract?.address.toString(),
    contract_balance: balance,
    ...contractData,
    sendIncrement: async () => {
      return mainContract?.sendIncrement(sender, toNano("0.05"), 5);
    },
    sendDeposit: async () => {
      return mainContract?.sendDeposit(sender, toNano("1"));
    },
    sendWithdrawalRequest: async () => {
      return mainContract?.sendWithdrawalRequest(
        sender,
        toNano("0.05"),
        toNano("0.7")
      );
    },
  };
}