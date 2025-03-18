import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllItems, deleteItem, updateItem } from '../services/itemService';
import { logoutAdmin } from '../services/authService';
import Navbar from '../components/Navbar';

const Admin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await getAllItems();
      setItems(data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching items');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        setItems(items.filter(item => item._id !== id));
      } catch (err) {
        setError('Error deleting item');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updatedItem = await updateItem(id, { status: newStatus });
      setItems(items.map(item => 
        item._id === id ? updatedItem : item
      ));
    } catch (err) {
      setError('Error updating item status');
    }
  };

  const handleLogout = () => {
    logoutAdmin();
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="text-center mt-8">Loading...</div>
    </>
  );
  
  if (error) return (
    <>
      <Navbar />
      <div className="text-red-500 text-center mt-8">{error}</div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{item.title}</td>
                  <td className="py-3 px-4">{item.category}</td>
                  <td className="py-3 px-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                      <option value="claimed">Claimed</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">{item.location}</td>
                  <td className="py-3 px-4">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 mr-2"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => navigate(`/admin/items/${item._id}`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Admin;
