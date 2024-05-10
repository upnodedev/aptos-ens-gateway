import { useState } from 'react'
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design'
import EditableField from './components/EditableField'
import { WALLET_OPTIONS } from './constants/resolver-fields'
import AddField from './components/AddField'

function App() {
  const [count, setCount] = useState(0)
  const domainName = "chomtana.eth"

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
              options={WALLET_OPTIONS}
              value=''
            ></EditableField>
          </div>

          <div>
            <AddField
              options={WALLET_OPTIONS}
              onCancel={async () => true}
            ></AddField>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
