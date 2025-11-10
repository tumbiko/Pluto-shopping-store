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

interface Address {
  _id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  default: boolean
  userId: string
}

const AddNewAddressPage = () => {
  const { user } = useUser()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.fullName ?? '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
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
      console.error("Failed to fetch addresses", err)
    }
  }

  useEffect(() => {
    if (user) fetchAddresses()
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
        name: user?.fullName ?? '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
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

  // Delete address
  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Delete this address?')
    if (!confirm) return
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

  // Edit address
  const handleEdit = (id: string) => router.push(`/edit-address/${id}`)

  // Toggle default
  const handleDefaultToggle = async (id: string) => {
  // Optimistically update state
  setAddresses(prev =>
    prev.map(addr => ({
      ...addr,
      default: addr._id === id,
    }))
  )

  try {
    // Update backend
    await Promise.all(
      addresses.map(a =>
        fetch(`/api/addresses/${a._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ default: a._id === id }),
        })
      )
    )
    toast.success('Default address updated!')
  } catch (err) {
    console.error(err)
    toast.error('Failed to set default')

    // Revert if error
    fetchAddresses()
  }
}


  return (
    <Container>
      <div className="py-10">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Home className="text-shop-dark-yellow" /> Manage Addresses
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Saved */}
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
                          <p className="font-semibold">{addr.name}</p>
                          <p className="text-sm text-gray-600">{addr.address}, {addr.city}, {addr.state} {addr.zip}</p>
                          <p className="text-sm text-gray-500">📞 {addr.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch
  checked={addr.default}
  onCheckedChange={() => handleDefaultToggle(addr._id)}
/>

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

          {/* Right - Add */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="text-green-600" /> Add New Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div><Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div><Label htmlFor="address">Street Address</Label>
                    <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="city">City</Label>
                      <Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                    </div>
                    <div><Label htmlFor="state">State / Region</Label>
                      <Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label htmlFor="zip">ZIP</Label>
                      <Input id="zip" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} required />
                    </div>
                    <div><Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                    </div>
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
