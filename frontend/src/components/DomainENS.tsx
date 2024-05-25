import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { DomainEns } from "../types/domain";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function DomainENS({ domain }: { domain: DomainEns }) {
  const { account } = useWallet();

  return (
    <div>
      <div className="font-bold text-gray-800">{domain.name}</div>
      <div className="text-gray-500 text-xs">
        Expire: {domain.expiryDate.toLocaleDateString()}
      </div>

      <div
        className={`mt-1 flex text-sm ${
          domain.aptosNamespace && domain.aptosNamespace == account?.address
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {domain.aptosNamespace && domain.aptosNamespace == account?.address ? (
          <CheckCircleFilled></CheckCircleFilled>
        ) : (
          <CloseCircleFilled></CloseCircleFilled>
        )}
        &nbsp;
        {domain.aptosNamespace
          ? domain.aptosNamespace == account?.address
            ? `Linked to Aptos Wallet`
            : `Linked to another Aptos Wallet`
          : `Not linked to Aptos`}
      </div>
    </div>
  );
}
