import React, { ReactNode, useContext, useReducer } from "react";

export interface ResolverFieldValue {
  field: string;
  value: string;
}

export interface DomainResolverState {
  address: string;
  addressExt: ResolverFieldValue[];
  text: ResolverFieldValue[];
  contentHash: string;
  loading: boolean;
}

const DEFAULT_RESOLVER_STATE: DomainResolverState = {
  address: "",
  addressExt: [],
  text: [],
  contentHash: "",
  loading: true,
};

const DomainResolverReducerContext = React.createContext<any>([]);

export function domainResolverReducer(
  state: DomainResolverState,
  action: any
): DomainResolverState {
  switch (action.type) {
    case "RESET": {
      return { ...DEFAULT_RESOLVER_STATE };
    }

    case "DATA": {
      const newState: any = { ...state };
      for (const key in action.data) {
        newState[key] = action.data[key];
      }
      return newState;
    }

    case "LOADING": {
      return {
        ...state,
        loading: Boolean(action.loading),
      };
    }

    default:
      return state;
  }
}

export function useDomainResolverReducer(): [
  DomainResolverState,
  React.Dispatch<any>
] {
  return useContext(DomainResolverReducerContext);
}

export function DomainResolverProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    domainResolverReducer,
    DEFAULT_RESOLVER_STATE
  );

  return (
    <DomainResolverReducerContext.Provider value={[state, dispatch]}>
      {children}
    </DomainResolverReducerContext.Provider>
  );
}
