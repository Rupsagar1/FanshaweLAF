import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllItems, updateItem, deleteItem } from '../services/itemService';
import { isAdminAuthenticated, logoutAdmin } from '../services/authService';

const AdminDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    // Fetch items
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await getAllItems();
        setItems(data);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to load items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [navigate]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateItem(id, { status: newStatus });
      // Refresh items after update
      const updatedItems = await getAllItems();
      setItems(updatedItems);
    } catch (error) {
      console.error('Error updating item status:', error);
      setError('Failed to update item status. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await deleteItem(id);
      // Refresh items after deletion
      const updatedItems = await getAllItems();
      setItems(updatedItems);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <div
            key={item._id}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="text-gray-600">{item.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Category: {item.category}</p>
                  <p>Location: {item.location}</p>
                  <p>Date: {new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="pending">Pending</option>
                  <option value="found">Found</option>
                  <option value="claimed">Claimed</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard; 