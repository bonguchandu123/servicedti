import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, X, Package, DollarSign } from 'lucide-react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_url: '',
    base_price: 0,
    pricing_type: 'fixed',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        setShowCreateModal(false);
        resetForm();
        alert('Category created successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/categories/${selectedCategory._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCategories();
        setShowEditModal(false);
        resetForm();
        alert('Category updated successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update category');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/admin/categories/${category._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...category, is_active: !category.is_active })
      });
      await fetchCategories();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/categories/${selectedCategory._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchCategories();
        setShowDeleteConfirm(false);
        setSelectedCategory(null);
        alert('Category deleted successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete category');
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon_url: category.icon_url || '',
      base_price: category.base_price,
      pricing_type: category.pricing_type || 'fixed',
      is_active: category.is_active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon_url: '',
      base_price: 0,
      pricing_type: 'fixed',
      is_active: true
    });
    setSelectedCategory(null);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = categories.filter(c => c.is_active).length;
  const inactiveCount = categories.length - activeCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Categories</h1>
        <p className="text-gray-600">Manage service categories and pricing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Categories</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{categories.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Power className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inactive</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{inactiveCount}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Power className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {category.icon_url ? (
                    <img src={category.icon_url} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-semibold text-gray-800">₹{category.base_price}</span>
                <span className="text-sm text-gray-500">base price</span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleActive(category)}
                  className={`flex-1 py-2 rounded-lg transition ${
                    category.is_active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <Power className="w-4 h-4 inline mr-1" />
                  {category.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => openEditModal(category)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setSelectedCategory(category); setShowDeleteConfirm(true); }}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No categories found</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Category</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Plumbing, Electrical"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the service category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon URL</label>
                  <input
                    type="text"
                    value={formData.icon_url}
                    onChange={(e) => setFormData({...formData, icon_url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
                  <select
                    value={formData.pricing_type}
                    onChange={(e) => setFormData({...formData, pricing_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="custom">Custom Quote</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_create"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active_create" className="text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Category</h2>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon URL</label>
                  <input
                    type="text"
                    value={formData.icon_url}
                    onChange={(e) => setFormData({...formData, icon_url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
                  <select
                    value={formData.pricing_type}
                    onChange={(e) => setFormData({...formData, pricing_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="custom">Custom Quote</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_edit"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active_edit" className="text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCategory}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Delete Category</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setSelectedCategory(null); }}
                className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;