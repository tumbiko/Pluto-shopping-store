'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const AddNewAddress = () => {
  return (
    <Link href="/add-new-address" className="w-full">
      <Button
        variant="outline"
        className="w-full mt-2 font-semibold tracking-wide cursor-pointer"
      >
        Add New Address
      </Button>
    </Link>
  )
}

export default AddNewAddress
