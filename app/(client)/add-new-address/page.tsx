'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import Container from '@/components/Container'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Home, Plus } from 'lucide-react'
import Image from 'next/image'
import { noaddress } from '@/images'

export interface Address {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  operator: string   // <-- add this
  address: string
  city: string
  state: string
  zip: string
  default: boolean
  userId: string
}


// Auto-detect operator based on Malawi phone prefixes
const detectOperator = (phone: string) => {
  const p = phone.replace(/\D/g, '')

  if (p.startsWith('88') || p.startsWith('89')) return 'tnm'
  if (p.startsWith('97') || p.startsWith('98') || p.startsWith('99')) return 'airtel'
  return ''
}

const AddNewAddressPage = () => {
  const { user } = useUser()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [operators, setOperators] = useState<any[]>([])

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

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/addresses?userId=${user.id}`)
      const data = await res.json()
      setAddresses(data)
    } catch (err) {
      console.error('Failed to fetch addresses', err)
    }
  }

  // Fetch PayChangu operators
  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/paychangu/operators')
      const data = await res.json()
      if (data.status === 'success') setOperators(data.data)
    } catch (err) {
      console.error('Failed to fetch operators', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAddresses()
      fetchOperators()
    }
  }, [user])

  // Add new address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user?.id }),
      })

      if (!res.ok) throw new Error('Failed')

      toast.success('Address added!')
      setFormData({
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

      fetchAddresses()
    } catch (err) {
      console.error(err)
      toast.error('Failed to add address')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmDel = window.confirm('Delete this address?')
    if (!confirmDel) return

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Address deleted')
      setAddresses(addresses.filter(a => a._id !== id))
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete')
    }
  }

  const handleEdit = (id: string) => router.push(`/edit-address/${id}`)

  // Handle phone change + auto-detect operator
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value
    setFormData(prev => ({
      ...prev,
      phone,
      operator: detectOperator(phone) || prev.operator,
    }))
  }

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Home className="text-shop-dark-yellow" /> Manage Addresses
        </h1>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Left - Saved Addresses */}
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
                        <div className="flex items-center gap-3">
                          <Pencil onClick={() => handleEdit(addr._id)} className="text-blue-600 cursor-pointer hover:text-blue-800" size={18} />
                          <Trash2 onClick={() => handleDelete(addr._id)} className="text-red-500 cursor-pointer hover:text-red-700" size={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-gray-500">
                    <Image src={noaddress} height={140} alt="No addresses" className="opacity-70 mb-4" />
                    <p className="text-base font-medium">No saved addresses yet</p>
                    <p className="text-sm text-gray-400 mb-4">Add a new address using the form on the right.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Add New Address */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="text-green-600" /> Add New Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAddress} className="space-y-4">

                  {/* First + Last Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State / Region</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* ZIP + Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Operator Dropdown */}
                  <div>
                    <Label htmlFor="operator">Mobile Money Operator</Label>
                    <select
                      id="operator"
                      value={formData.operator}
                      onChange={e => setFormData({ ...formData, operator: e.target.value })}
                      className="w-full p-2 border"
                      required
                    >
                      <option value="">Select operator</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.short_code}>{op.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Default Switch */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="default">Set as default</Label>
                    <Switch
                      checked={formData.default}
                      onCheckedChange={checked => setFormData({ ...formData, default: checked })}
                    />
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
