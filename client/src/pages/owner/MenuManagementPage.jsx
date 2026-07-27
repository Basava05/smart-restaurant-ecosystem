import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { MenuCardSkeleton } from '../../components/ui/Skeleton';

export default function MenuManagementPage() {
  const { addToast } = useToast();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Minimal form state for new item
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    prepTime: '15',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: restData } = await api.get('/api/restaurants/owner/me');
        setRestaurant(restData.data);
        
        if (restData.data) {
          const { data: menuData } = await api.get(`/api/menu/restaurant/${restData.data._id}`);
          setMenuItems(menuData.data);
        }
      } catch (err) {
        addToast('Failed to load menu data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    
    try {
      const { data } = await api.post(`/api/menu/restaurant/${restaurant._id}`, formData);
      setMenuItems((prev) => [...prev, data.data]);
      setIsAdding(false);
      setFormData({ name: '', category: '', price: '', prepTime: '15' });
      addToast('Item added to menu.', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add item.', 'error');
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await api.delete(`/api/menu/${itemId}`);
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
      addToast('Item deleted.', 'info');
    } catch (err) {
      addToast('Failed to delete item.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <MenuCardSkeleton />
        <MenuCardSkeleton />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <EmptyState
        title="No restaurant found"
        description="You need a registered restaurant profile before managing a menu."
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Menu Management</h2>
          <p className="text-rail font-body text-sm mt-1">Manage items, prices, and availability.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? 'Cancel' : 'Add Item'}
        </Button>
      </header>

      {isAdding && (
        <Card className="bg-surface border-ember/20">
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-ink border-b border-rail/10 pb-2">
              New Menu Item
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                label="Category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <Input
                label="Price (₹)"
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Input
                label="Prep Time (mins)"
                type="number"
                required
                min="1"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary">Save Item</Button>
            </div>
          </form>
        </Card>
      )}

      {menuItems.length === 0 && !isAdding ? (
        <EmptyState
          title="Your menu is empty"
          description="Add your first dish to start taking orders."
          action={<Button onClick={() => setIsAdding(true)}>Add Item</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card key={item._id} className="flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-display text-lg font-semibold text-ink">{item.name}</h4>
                  <span className="font-mono font-semibold text-ink">₹{item.price}</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-rail mt-1 block">
                  {item.category}
                </span>
                <div className="text-sm text-rail mt-4 space-y-1">
                  <p>Prep time: {item.prepTime} mins</p>
                  <p>Status: {item.available ? 'Available' : 'Unavailable'}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-rail/10 flex justify-end">
                <Button variant="danger" size="sm" onClick={() => handleDelete(item._id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
