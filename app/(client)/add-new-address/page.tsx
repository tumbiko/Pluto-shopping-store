'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Container from '@/components/Container';
import toast from 'react-hot-toast';
import { Home, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import Image from 'next/image';
import { noaddress } from '@/images';
import { client } from '@/sanity/lib/client';

export interface Address {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  operator?: string;
  operatorRefId?: string;
  operatorName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  default?: boolean;
  userId?: string;
}

interface Operator {
  id: string | number;
  name: string;
  short_code: string;
  ref_id: string;
}

const operatorRefMap: Record<string, string> = {
  tnm: '27494cb5-ba9e-437f-a114-4e7a7686bcca',
  airtel: '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
};

const detectOperator = (phone?: string) => {
  const p = (phone || '').replace(/\D/g, '');
  if (p.startsWith('88') || p.startsWith('89')) return 'tnm';
  if (p.startsWith('97') || p.startsWith('98') || p.startsWith('99')) return 'airtel';
  return '';
};

const AddNewAddressPage: React.FC = () => {
  const { user } = useUser();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);

  // form for adding
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
  });

  // edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Address> | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [k: string]: boolean }>({});

  // Fetch operators
  const fetchOperators = useCallback(async () => {
    try {
      const res = await fetch('/api/paychangu/get-operators');
      if (!res.ok) {
        console.error('Failed to fetch operators', res.status);
        return;
      }
      const json = await res.json();
      const ops = Array.isArray(json.data) ? json.data : json;
      setOperators(ops as Operator[]);
    } catch (err) {
      console.error('Error fetching operators:', err);
    }
  }, []);

  // Fetch addresses from Sanity (same shape as CartPage)
  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const query = `*[_type=="address" && userId == $userId] | order(_createdAt desc){
        _id, firstName, lastName, email, phone, operator, operatorRefId, address, city, state, zip, "default": default, operatorName
      }`;
      const data = (await client.fetch(query, { userId: user.id })) as Address[];
      setAddresses(data ?? []);
    } catch (err) {
      console.error('Error fetching addresses from sanity', err);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchOperators();
    }
  }, [user, fetchAddresses, fetchOperators]);

  // helpers
  const resolveOperatorRefId = (operatorIdOrShortCode?: string, phone?: string) => {
    if (operatorIdOrShortCode) {
      const found = operators.find((op) => String(op.id) === String(operatorIdOrShortCode));
      if (found) return found.ref_id;
      const foundByShort = operators.find((op) => op.short_code === operatorIdOrShortCode);
      if (foundByShort) return foundByShort.ref_id;
    }
    if (phone) {
      const detected = detectOperator(phone);
      return operatorRefMap[detected] ?? '';
    }
    return '';
  };

  const getOperatorDisplay = (addr: Address) => {
    if (!addr) return '';
    if (addr.operatorName) return addr.operatorName;
    if (addr.operator && /[A-Za-z]/.test(String(addr.operator)) && String(addr.operator).length > 2)
      return String(addr.operator);
    const match =
      operators.find((op) => String(op.id) === String(addr.operator)) ||
      operators.find((op) => op.ref_id === addr.operatorRefId) ||
      operators.find((op) => op.ref_id === addr.operator);
    return match ? match.name : addr.operatorRefId ?? addr.operator ?? '';
  };

  // handle phone change when adding -> detect operator id if we have it
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    const detected = detectOperator(phone);
    const matchedOperator = operators.find((op) => op.short_code?.toLowerCase() === detected?.toLowerCase());
    setFormData((prev) => ({
      ...prev,
      phone,
      operator: matchedOperator ? String(matchedOperator.id) : prev.operator,
    }));
  };

  // ADD address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const operatorRefId = resolveOperatorRefId(formData.operator, formData.phone);
    const operatorName =
      operators.find((op) => String(op.id) === String(formData.operator))?.name ||
      operators.find((op) => op.ref_id === operatorRefId)?.name ||
      '';

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
      phone: formData.phone,
      operator: formData.operator,
      operatorRefId,
      operatorName,
      default: formData.default,
      userId: user?.id,
    };

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('POST /api/addresses failed', res.status, text);
        throw new Error('Failed to save address');
      }
      let saved: Address | null = null;
      try {
        saved = JSON.parse(text);
      } catch {
        // server may not return the saved address — we'll re-fetch
      }

      toast.success('Address added!');
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
      });

      if (saved && saved._id) {
        setAddresses((prev) => [saved!, ...prev]);
      } else {
        await fetchAddresses();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  // DELETE address
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setActionLoading((s) => ({ ...s, [id]: true }));
    // optimistic remove
    const prev = addresses;
    setAddresses((a) => a.filter((x) => x._id !== id));
    try {
      // adapt if your API expects a body instead of query param
      const res = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Delete failed: ${t}`);
      }
      toast.success('Address deleted');
    } catch (err) {
      console.error('Delete failed', err);
      toast.error('Failed to delete address');
      setAddresses(prev); // rollback
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // PATCH/update single address (generic)
  const patchAddress = async (id: string, updates: Partial<Address>) => {
    setActionLoading((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch('/api/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('PATCH /api/addresses failed', res.status, text);
        throw new Error('Update failed');
      }
      let updated: Address | null = null;
      try {
        updated = JSON.parse(text);
      } catch {
        // server might not return object; we'll re-fetch instead
      }
      if (updated && updated._id) {
        setAddresses((prev) => prev.map((a) => (a._id === id ? updated! : a)));
      } else {
        await fetchAddresses();
      }
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to update address');
      return false;
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // Toggle default address:
  // - if toggling true on address X, unset previous default (if any) and set X default true.
  const handleToggleDefault = async (address: Address) => {
    if (address.default) {
      // simply unset this one
      const success = await patchAddress(address._id, { default: false });
      if (success) {
        setAddresses((prev) => prev.map((a) => (a._id === address._id ? { ...a, default: false } : a)));
        toast.success('Default removed');
      }
      return;
    }

    // set optimistic UI: unset previous default and set this one
    const prev = addresses;
    const prevDefault = addresses.find((a) => a.default);
    setAddresses((s) =>
      s.map((a) => {
        if (a._id === address._id) return { ...a, default: true };
        if (a._id === prevDefault?._id) return { ...a, default: false };
        return a;
      })
    );

    try {
      // first set new default true
      const setNew = await patchAddress(address._id, { default: true });
      if (!setNew) throw new Error('Failed to set new default');

      // unset previous default if existed
      if (prevDefault && prevDefault._id !== address._id) {
        const unsetOld = await patchAddress(prevDefault._id, { default: false });
        if (!unsetOld) {
          // rollback if cannot unset old (server-side may accept only one default)
          throw new Error('Failed to unset old default');
        }
      }
      toast.success('Default address updated');
    } catch (err) {
      console.error('Error toggling default:', err);
      toast.error('Failed to update default address');
      setAddresses(prev); // rollback
    }
  };

  // EDIT: open inline edit
  const startEdit = (addr: Address) => {
    setEditingId(addr._id);
    setEditForm({
      firstName: addr.firstName,
      lastName: addr.lastName,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      phone: addr.phone,
      operator: addr.operator,
      operatorRefId: addr.operatorRefId,
      default: addr.default,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm) return;
    setActionLoading((s) => ({ ...s, [id]: true }));
    const operatorRefId = resolveOperatorRefId(String(editForm.operator ?? ''), String(editForm.phone ?? ''));
    const updates: Partial<Address> = { ...editForm, operatorRefId };
    try {
      const ok = await patchAddress(id, updates);
      if (ok) {
        toast.success('Address updated');
        setEditingId(null);
        setEditForm(null);
      }
    } finally {
      setActionLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // For keyboard-accessible toggles / buttons
  const handleKeySetDefault = (e: React.KeyboardEvent, addr: Address) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleDefault(addr);
    }
  };

  // Styling helpers for dark hover — create classes once (keeps JSX cleaner)
  const cardBase =
    'p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-150';
  const cardHover =
    'hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md border-gray-200 dark:border-gray-700';

  // computed: operator list as options for edit/add selects
  const operatorOptions = useMemo(
    () => operators.map((op) => ({ id: String(op.id), name: op.name, ref_id: op.ref_id, short_code: op.short_code })),
    [operators]
  );

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
                {loading ? (
                  <div className="py-12 text-center text-gray-500">Loading addresses…</div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-4">
                    {addresses.map((addr) => {
                      const isEditing = editingId === addr._id;
                      return (
                        <div key={addr._id} className={`${cardBase} ${cardHover}`}>
                          <div className="flex-1">
                            {!isEditing ? (
                              <>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-semibold">
                                      {addr.firstName} {addr.lastName}
                                      {addr.default && (
                                        <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                          Default
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {addr.address}, {addr.city}, {addr.state} {addr.zip}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      📞 {addr.phone} ({getOperatorDisplay(addr)})
                                    </p>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex items-start gap-2 ml-3">
                                    <button
                                      title="Edit address"
                                      onClick={() => startEdit(addr)}
                                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    </button>

                                    <button
                                      title="Delete address"
                                      onClick={() => handleDelete(addr._id)}
                                      disabled={!!actionLoading[addr._id]}
                                      className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              // Inline edit form
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={String(editForm?.firstName ?? '')}
                                    onChange={(e) => setEditForm((s) => ({ ...(s ?? {}), firstName: e.target.value }))}
                                    placeholder="First name"
                                  />
                                  <Input
                                    value={String(editForm?.lastName ?? '')}
                                    onChange={(e) => setEditForm((s) => ({ ...(s ?? {}), lastName: e.target.value }))}
                                    placeholder="Last name"
                                  />
                                </div>

                                <Input
                                  value={String(editForm?.address ?? '')}
                                  onChange={(e) => setEditForm((s) => ({ ...(s ?? {}), address: e.target.value }))}
                                  placeholder="Street address"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={String(editForm?.city ?? '')}
                                    onChange={(e) => setEditForm((s) => ({ ...(s ?? {}), city: e.target.value }))}
                                    placeholder="City"
                                  />
                                  <Input
                                    value={String(editForm?.state ?? '')}
                                    onChange={(e) => setEditForm((s) => ({ ...(s ?? {}), state: e.target.value }))}
                                    placeholder="State"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={String(editForm?.zip ?? '')}
                                    onChange={(e) => setEditForm((s) => ({ ...(s ?? {}), zip: e.target.value }))}
                                    placeholder="ZIP"
                                  />
                                  <Input
                                    value={String(editForm?.phone ?? '')}
                                    onChange={(e) =>
                                      setEditForm((s) => ({ ...(s ?? {}), phone: e.target.value }))
                                    }
                                    placeholder="Phone"
                                  />
                                </div>

                                <div>
                                  <Label>Operator</Label>
                                  <select
                                    value={String(editForm?.operator ?? '')}
                                    onChange={(e) =>
                                      setEditForm((s) => ({ ...(s ?? {}), operator: e.target.value }))
                                    }
                                    className="w-full p-2 border rounded"
                                  >
                                    <option value="">Choose operator</option>
                                    {operatorOptions.map((o) => (
                                      <option key={o.id} value={o.id}>
                                        {o.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => saveEdit(addr._id)}
                                    disabled={!!actionLoading[addr._id]}
                                    className="flex items-center gap-2"
                                    size="sm"
                                  >
                                    {actionLoading[addr._id] ? 'Saving...' : <><Check className="w-4 h-4" /> Save</>}
                                  </Button>
                                  <Button onClick={cancelEdit} variant="ghost" size="sm" className="flex items-center gap-2">
                                    <X className="w-4 h-4" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right column: default toggle */}
                          <div className="flex flex-col items-end gap-2">
                            <div
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => handleKeySetDefault(e, addr)}
                              onClick={() => handleToggleDefault(addr)}
                              className="flex items-center gap-2 cursor-pointer select-none"
                              aria-pressed={!!addr.default}
                              title={addr.default ? 'Unset default address' : 'Set as default address'}
                            >
                              <Switch checked={!!addr.default} onCheckedChange={() => handleToggleDefault(addr)} />
                              <span className="text-sm text-gray-600 dark:text-gray-300">Default</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                    </div>
                    <div>
                      <Label htmlFor="state">State / Region</Label>
                      <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP</Label>
                      <Input id="zip" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required />
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
                      value={formData.operator}
                      onChange={(e) => setFormData((prev) => ({ ...prev, operator: e.target.value }))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-400"
                      required
                    >
                      <option value="">Select operator</option>
                      {operatorOptions.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="default">Set as default</Label>
                    <Switch checked={formData.default} onCheckedChange={(checked) => setFormData({ ...formData, default: checked })} />
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
  );
};

export default AddNewAddressPage;
