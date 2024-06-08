
export interface DomainEns {
  id: string
  name: string
  owner: `0x${string}`
  expiryDate: Date
  resolver: string
  hasCCIPContext: boolean
  aptosNamespace?: string
  isWrapped?: boolean
  isApt?: boolean
}