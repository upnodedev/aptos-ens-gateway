import { useState } from 'react'
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design'
import EditableField from './components/EditableField'
import { WALLET_OPTIONS } from './constants/resolver-fields'
import AddField from './components/AddField'
import { useAptosResolverActions, useAptosResolverData } from './hooks/aptos-resolver'

function App() {
  const [count, setCount] = useState(0)
  const domainName = "chomtana.eth"

  const [ state, dispatch, fetchData ] = useAptosResolverData(domainName)
  const { setAddr, setAddrExt, setText } = useAptosResolverActions(domainName)

  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='flex justify-between items-center'>
          <div className='flex'>Logo</div>
          <WalletSelector></WalletSelector>
        </div>

        <div className='my-5'>
          <div className='text-2xl mb-2'>Wallet Addresses</div>

          <div>
            <EditableField
              options={[
                {
                  value: '637',
                  label: 'Aptos',
                }
              ]}
              value={state.address}
              onCancel={async () => {
                try {
                  await setAddr('0x0000000000000000000000000000000000000000000000000000000000000000')
                  return true
                } catch (err) {
                  console.error(err)
                  return false
                }
              }}
              onSave={async (_, value) => {
                try {
                  if (value.startsWith('0x')) {
                    await setAddr(value as `0x${string}`)
                    return true
                  } else {
                    window.alert('Validation Failed!')
                    return false
                  }                  
                } catch (err) {
                  console.error(err)
                  return false
                }
              }}
            ></EditableField>
          </div>

          <div>
            <AddField
              options={WALLET_OPTIONS}
              onCancel={async () => true}
              onSave={async (field, value) => {
                try {
                    await setAddrExt(parseInt(field), value)
                    return true
                } catch (err) {
                  console.error(err)
                  return false
                }
              }}
            ></AddField>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
