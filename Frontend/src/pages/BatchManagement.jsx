import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { batchAPI, userAPI } from '../api/batch';
import SessionFormModal from '../components/SessionFormModal';

import Navbar from '../components/Navbar';

const BatchManagement = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBatch, setEditingBatch] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showToast('Access denied', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, showToast]);
  
  // Fetch batches and trainers
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, trainersRes] = await Promise.all([
        batchAPI.getBatches(),
        userAPI.getTrainers()
      ]);
      setBatches(batchesRes.batches || []);
      setTrainers(trainersRes.trainers || []);
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast(error.response?.data?.message || 'Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setEditingBatch(null);
    setShowModal(false);
  };

  const handleSuccess = () => {
    fetchData();
  };
  
  const handleDelete = async (batchId) => {
    try {
      await batchAPI.deleteBatch(batchId);
      showToast('Batch deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete batch', 'error');
    }
  };

  const handleCancelBatch = async (batchId) => {
    try {
      await batchAPI.cancelBatch(batchId);
      showToast('Session cancelled successfully', 'success');
      setCancelConfirm(null);
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to cancel session', 'error');
    }
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      Upcoming: 'bg-amber-100 text-amber-700 border-amber-200',
      Live: 'bg-green-100 text-green-700 border-green-200',
      Expired: 'bg-slate-100 text-slate-600 border-slate-200',
      Cancelled: 'bg-red-50 text-red-600 border-red-100'
    };
    
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badges[status] || badges.Upcoming}`}>
        {status}
      </span>
    );
  };
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <Navbar />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Session Management</h1>
            <p className="text-slate-500 text-sm">Create, update, and manage training schedules</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:from-orange-600 hover:to-purple-700 active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Session
          </button>
        </div>
        
        {/* Session Form Modal */}
        <SessionFormModal 
          isOpen={showModal}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          trainers={trainers}
          editingBatch={editingBatch}
        />
        
        {/* Batch List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">All Scheduled Batches</h2>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{batches.length}</span>
          </div>
          
          {batches.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No batches found</h3>
              <p className="text-slate-500 text-sm">Create your first batch using the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Details</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time Window</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trainer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {batches.map(batch => {
                    const start = formatDateTime(batch.startAt);
                    const end = formatDateTime(batch.endAt);
                    
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900">{batch.batchName}</div>
                          <div className="text-xs text-slate-500 mt-0.5 font-medium">{start.date}</div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 text-sm text-slate-600 font-mono bg-slate-50 border border-slate-100 w-fit px-2 py-1 rounded">
                             {start.time} <span className="text-slate-400">-</span> {end.time}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                             {batch.trainers && batch.trainers.length > 0 ? (
                               batch.trainers.map((trainer, index) => (
                                <div key={trainer.id || index} className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold uppercase border border-blue-100 shrink-0">
                                    {trainer.name.charAt(0)}
                                  </div>
                                  <div>
                                     <div className="text-sm font-medium text-slate-900 leading-none">{trainer.name}</div>
                                     <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Trainer</div>
                                  </div>
                                </div>
                               ))
                             ) : (
                               <div className="text-sm text-slate-500 italic">No trainers assigned</div>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(batch.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(batch)}
                              disabled={batch.status !== 'Upcoming'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                batch.status !== 'Upcoming'
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title={batch.status !== 'Upcoming' ? "Only upcoming sessions can be edited" : "Edit Session"}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setCancelConfirm(batch.id)}
                              disabled={batch.status === 'Cancelled' || batch.status === 'Expired'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                (batch.status === 'Cancelled' || batch.status === 'Expired')
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={batch.status === 'Cancelled' ? "Already cancelled" : (batch.status === 'Expired' ? "Cannot cancel expired session" : "Cancel Session")}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(batch.id)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Batch"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fadeIn scale-100 border border-slate-100">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Delete Session?</h3>
            <p className="text-slate-500 mb-8 text-center text-sm">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fadeIn scale-100 border border-slate-100">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500 mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Cancel Session?</h3>
            <p className="text-slate-500 mb-8 text-center text-sm">
              Are you sure you want to cancel this session? It will be marked as cancelled but not deleted.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => handleCancelBatch(cancelConfirm)}
                className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
