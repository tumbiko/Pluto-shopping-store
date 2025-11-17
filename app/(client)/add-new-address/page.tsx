'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import Container from '@/components/Container'
import toast from 'react-hot-toast'
import { Home, Plus } from 'lucide-react'
import Image from 'next/image'
import { noaddress } from '@/images'

export interface Address {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  operator: string
  operatorRefId?: string
  address: string
  city: string
  state: string
  zip: string
  default: boolean
  userId: string
}

interface Operator {
  id: string
  name: string
  short_code: string
  ref_id: string
}

const operatorRefMap: Record<string, string> = {
  tnm: "27494cb5-ba9e-437f-a114-4e7a7686bcca",
  airtel: "20be6c20-adeb-4b5b-a7ba-0769820df4fb",
}

const detectOperator = (phone: string) => {
  const p = phone.replace(/\D/g, '')
  if (p.startsWith('88') || p.startsWith('89')) return 'tnm'
  if (p.startsWith('97') || p.startsWith('98') || p.startsWith('99')) return 'airtel'
  return ''
}

const AddNewAddressPage: React.FC = () => {
  const { user } = useUser()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [operators, setOperators] = useState<Operator[]>([])

  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    operator: '',
    default: false,
  })

  const fetchAddresses = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/addresses?userId=${user.id}`)
      if (!res.ok) return
      const data: Address[] = await res.json()
      setAddresses(data)
    } catch (err) {
      console.error(err)
    }
  }, [user])

 const fetchOperators = useCallback(async () => {
  try {
    const res = await fetch('/api/paychangu/get-operators');
    if (!res.ok) return console.error('Failed to fetch operators');
    const json: { status: string; data: Operator[] } = await res.json();
    if (json.status === 'success') setOperators(json.data);
  } catch (err) {
    console.error('Error fetching operators:', err);
  }
}, []);

useEffect(() => {
  fetchOperators();
}, [fetchOperators]);

  useEffect(() => {
    if (user) {
      fetchAddresses()
      fetchOperators()
    }
  }, [user, fetchAddresses, fetchOperators])

  // When handling phone change, store operator **ID** that matches the operators list
const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const phone = e.target.value
  const detected = detectOperator(phone) // 'tnm' | 'airtel' | ''
  
  // Find the operator in your operators array
  const matchedOperator = operators.find(op => op.short_code === detected)

  setFormData(prev => ({
    ...prev,
    phone,
    operator: matchedOperator?.id || prev.operator, // store the ID, not 'tnm' string
  }))
}


  const handleAddAddress = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  const selectedOperator = operators.find(op => op.id === formData.operator)
  const operatorRefId = selectedOperator?.ref_id || ''

  try {
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, operatorRefId, userId: user?.id }),
    })
    if (!res.ok) throw new Error('Failed to save')
    toast.success('Address added!')
    setFormData({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      operator: '', // reset
      default: false,
    })
    await fetchAddresses()
  } catch (err) {
    console.error(err)
    toast.error('Failed to add address')
  } finally {
    setLoading(false)
  }
}


  return (
    <Container>
      <div className="py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Home className="text-shop-dark-yellow" /> Manage Addresses
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Saved addresses */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Saved Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map(addr => (
                      <div key={addr._id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50 transition">
                        <div className="flex-1">
                          <p className="font-semibold">{addr.firstName} {addr.lastName}</p>
                          <p className="text-sm text-gray-600">{addr.address}, {addr.city}, {addr.state} {addr.zip}</p>
                          <p className="text-sm text-gray-500">📞 {addr.phone} ({addr.operator})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500">
                    <Image src={noaddress} height={140} alt="No addresses" className="opacity-70 mb-4" />
                    <p className="text-base font-medium">No saved addresses yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Add new address */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="text-green-600" /> Add New Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                    </div>
                    <div>
                      <Label htmlFor="state">State / Region</Label>
                      <Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP</Label>
                      <Input id="zip" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={formData.phone} onChange={handlePhoneChange} required />
                    </div>
                  </div>

                  <div>
  <Label htmlFor="operator">Mobile Money Operator</Label>
  <select
  id="operator"
  value={formData.operator} // store operator id here
  onChange={e => {
    setFormData(prev => ({ ...prev, operator: e.target.value }))
  }}
  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-400"
  required
>
  <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Select operator</option>
  {operators.map(op => (
    <option key={op.id} value={op.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {op.name}
    </option>
  ))}
</select>

</div>


                  <div className="flex items-center justify-between">
                    <Label htmlFor="default">Set as default</Label>
                    <Switch checked={formData.default} onCheckedChange={checked => setFormData({...formData, default: checked})} />
                  </div>

                  <Separator />
                  <Button type="submit" disabled={loading} className="w-full font-semibold rounded-full">
                    {loading ? 'Saving...' : 'Save Address'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default AddNewAddressPage
