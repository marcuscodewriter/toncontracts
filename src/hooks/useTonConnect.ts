import { useTonConnectUI } from "@tonconnect/ui-react";
import { Address, Sender, SenderArguments } from "ton-core";

export function useTonConnect(): { sender: Sender; connectedAddress: Address | undefined; connected: boolean } {
  const [tonConnectUI] = useTonConnectUI();

  return {
    sender: {
      send: async (args: SenderArguments) => {
        tonConnectUI.sendTransaction({
          messages: [
            {
              address: args.to.toString(),
              amount: args.value.toString(),
              payload: args.body?.toBoc().toString("base64"),
            },
          ],
          validUntil: Date.now() + 5 * 60 * 1000,
        });
      },
    },
    connectedAddress: tonConnectUI.account?.address ? Address.parse(tonConnectUI.account.address) : undefined,
    connected: tonConnectUI.connected,
  };
}