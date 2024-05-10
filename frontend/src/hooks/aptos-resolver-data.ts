import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useDomainResolverReducer } from "../reducers/DomainResolverReducer";
import { useCallback, useEffect } from "react";

export default function useAptosResolverData(domainName: string) {
  const { account } = useWallet();
  const [ state, dispatch ] = useDomainResolverReducer()

  const fetchData = useCallback(async () => {
    
  }, [ domainName, account, dispatch ])

  useEffect(() => {
    if (domainName && account) {
      fetchData();
    }
  }, [ domainName, account, dispatch ])

  return [ state, dispatch, fetchData ]
}