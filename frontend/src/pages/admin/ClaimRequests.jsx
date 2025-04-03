import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClaimRequests = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/claims`);
      console.log('API Response:', response.data); // Debug log
      
      // Ensure we're working with an array
      const claimsData = response.data?.claims || response.data || [];
      setClaims(Array.isArray(claimsData) ? claimsData : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError('Failed to fetch claim requests');
      toast.error('Failed to fetch claim requests');
      setClaims([]);
      setLoading(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/claims/${claimId}/approve`);
      toast.success('Claim approved successfully');
      fetchClaims();
    } catch (err) {
      console.error('Error approving claim:', err);
      toast.error('Failed to approve claim');
    }
  };

  const handleRejectClaim = async (claimId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/claims/${claimId}/reject`);
      toast.success('Claim rejected successfully');
      fetchClaims();
    } catch (err) {
      console.error('Error rejecting claim:', err);
      toast.error('Failed to reject claim');
    }
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-600">{error}</div>;

  // Ensure claims is an array before mapping
  const claimsList = Array.isArray(claims) ? claims : [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Claim Requests</h2>
      
      {claimsList.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No claim requests found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 border-b text-left">Item Details</th>
                <th className="px-6 py-3 border-b text-left">Claimant Details</th>
                <th className="px-6 py-3 border-b text-left">Status</th>
                <th className="px-6 py-3 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {claimsList.map((claim) => (
                <tr key={claim._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 border-b">
                    <div>
                      <p className="font-semibold">{claim.item?.title || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Category: {claim.item?.category || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Location: {claim.item?.location || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <div>
                      <p className="font-semibold">{claim.claimedBy?.firstName} {claim.claimedBy?.lastName}</p>
                      <p className="text-sm text-gray-600">Email: {claim.claimedBy?.email || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Phone: {claim.claimedBy?.phoneNumber || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      claim.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {claim.status?.charAt(0).toUpperCase() + claim.status?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b">
                    {claim.status === 'pending' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleApproveClaim(claim._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClaim(claim._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClaimRequests; 