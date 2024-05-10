import { useState } from 'react'
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design'
import EditableField from './components/EditableField'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='container mx-auto p-4'>
        <div className='flex justify-between items-center'>
          <div className='flex'>Logo</div>
          <WalletSelector></WalletSelector>
        </div>

        <div className='my-5'>
          <div className='text-2xl'>Wallet Addresses</div>

          <div>
            <EditableField
              options={[
                {
                  value: 'Ethereum',
                  label: 'Ethereum',
                },
                {
                  value: 'Github',
                  label: 'Github',
                }
              ]}
              value=''
            ></EditableField>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
