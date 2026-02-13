import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { batchAPI } from '../api/batch';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const SessionFormModal = ({ isOpen, onClose, onSuccess, trainers, editingBatch }) => {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    batchName: '',
    trainerIds: [],
    date: '',
    startTime: '',
    endTime: '',
    labCredentials: {
      loginUrl: '',
      username: '',
      password: ''
    }
  });
  const [formErrors, setFormErrors] = useState({});

  // Initialize form when editingBatch changes or modal opens
  // Initialize form when editingBatch changes or modal opens
  useEffect(() => {
    if (editingBatch) {
      const startDate = new Date(editingBatch.startAt);
      const endDate = new Date(editingBatch.endAt);
      
      setFormData({
        batchName: editingBatch.batchName || '',
        trainerIds: editingBatch.trainers?.map(t => t.id) || [],
        date: startDate.toISOString().split('T')[0],
        startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
        endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
        labCredentials: {
          loginUrl: editingBatch.labCredentials?.loginUrl || '',
          username: editingBatch.labCredentials?.username || '',
          password: editingBatch.labCredentials?.password || ''
        }
      });
    } else {
      // Reset for create mode
      setFormData({
        batchName: '',
        trainerIds: [],
        date: '',
        startTime: '',
        endTime: '',
        labCredentials: {
          loginUrl: '',
          username: '',
          password: ''
        }
      });
    }
    setFormErrors({});
  }, [editingBatch, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested credentials fields
    if (name.startsWith('labCredentials.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        labCredentials: {
          ...prev.labCredentials,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTrainerToggle = (trainerId) => {
    setFormData(prev => {
      const currentIds = prev.trainerIds || [];
      if (currentIds.includes(trainerId)) {
        return { ...prev, trainerIds: currentIds.filter(id => id !== trainerId) };
      } else {
        return { ...prev, trainerIds: [...currentIds, trainerId] };
      }
    });

    // Clear error
    if (formErrors.trainerIds) {
      setFormErrors(prev => ({ ...prev, trainerIds: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.batchName.trim()) {
      errors.batchName = 'Batch name is required';
    } else if (formData.batchName.length < 3) {
      errors.batchName = 'Batch name must be at least 3 characters';
    }
    
    if (!formData.trainerIds || formData.trainerIds.length === 0) {
      errors.trainerIds = 'Please select at least one trainer';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    if (!formData.labCredentials.loginUrl) {
      errors['labCredentials.loginUrl'] = 'Lab URL is required';
    } else {
      try {
        new URL(formData.labCredentials.loginUrl);
      } catch (_) {
        errors['labCredentials.loginUrl'] = 'Please enter a valid URL';
      }
    }

    if (!formData.labCredentials.username) {
      errors['labCredentials.username'] = 'Username is required';
    }

    if (!formData.labCredentials.password) {
      errors['labCredentials.password'] = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setFormErrors({});
      
      let response;
      if (editingBatch) {
        response = await batchAPI.updateBatch(editingBatch.id, formData);
      } else {
        response = await batchAPI.createBatch(formData);
      }
      
      // Handle server-side validation errors returned as 200 OK
      if (response && response.success === false) {
        if (response.fieldErrors) {
          setFormErrors(response.fieldErrors);
        }
        showToast(response.message || 'Failed to save batch', 'error');
        setSubmitting(false);
        return;
      }

      showToast(editingBatch ? 'Batch updated successfully' : 'Batch created successfully', 'success');
      
      onSuccess(); // Refresh parent list
      onClose();   // Close modal
      
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.fieldErrors) {
        setFormErrors(errorData.fieldErrors);
      }
      showToast(errorData?.message || 'Failed to save batch', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper functions for DatePicker
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const parseTimeString = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };
  
  const formatDateForInput = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {editingBatch ? 'Edit Session' : 'Schedule Session'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {editingBatch ? 'Update the details for this training batch.' : 'Create a new training batch and assign lab credentials.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form id="session-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Session Details */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Session Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Batch Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Batch Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="batchName"
                      value={formData.batchName}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white font-medium text-slate-800 ${
                        formErrors.batchName ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      }`}
                      placeholder="e.g. React Advanced Training - June Cohort"
                    />
                  </div>
                  {formErrors.batchName && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.batchName}</p>
                  )}
                </div>
                
                {/* Trainer */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Assign Trainer <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto custom-scrollbar">
                    {trainers.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {trainers.map(trainer => {
                          const isSelected = formData.trainerIds?.includes(trainer.id);
                          return (
                            <label 
                              key={trainer.id} 
                              className={`flex items-center px-4 py-3 cursor-pointer transition-colors ${
                                isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTrainerToggle(trainer.id)}
                                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-blue-500 checked:bg-blue-500 hover:border-blue-400"
                                />
                                <svg
                                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M10 3L4.5 8.5L2 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                  {trainer.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{trainer.email}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-sm">No trainers available</div>
                    )}
                  </div>
                  {formErrors.trainerIds && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.trainerIds}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Warning for LIVE batch */}
            {editingBatch && editingBatch.status === 'Live' && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-start animate-fadeIn">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-amber-800">Batch is currently LIVE</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Time adjustments are disabled for active sessions to prevent disruption.
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: Schedule */}
            <div className="space-y-6">
               <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                Schedule
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date */}
                <div className="custom-datepicker-wrapper">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <DatePicker
                      selected={parseDateString(formData.date)}
                      onChange={(date) => {
                        handleInputChange({ target: { name: 'date', value: formatDateForInput(date) } });
                      }}
                      dateFormat="MM/dd/yyyy"
                      minDate={new Date()}
                      disabled={editingBatch && editingBatch.status === 'Live'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white font-medium text-slate-800 ${
                        formErrors.date ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      } ${editingBatch && editingBatch.status === 'Live' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                      placeholderText="Select date"
                    />
                  </div>
                  {formErrors.date && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.date}</p>
                  )}
                </div>
                
                {/* Start Time */}
                <div className="custom-datepicker-wrapper">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <DatePicker
                      selected={parseTimeString(formData.startTime)}
                      onChange={(date) => {
                        handleInputChange({ target: { name: 'startTime', value: formatTimeForInput(date) } });
                      }}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      disabled={editingBatch && editingBatch.status === 'Live'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white font-medium text-slate-800 ${
                        formErrors.startTime ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      } ${editingBatch && editingBatch.status === 'Live' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                      placeholderText="--:-- --"
                    />
                  </div>
                  {formErrors.startTime && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.startTime}</p>
                  )}
                </div>
                
                {/* End Time */}
                <div className="custom-datepicker-wrapper">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <DatePicker
                      selected={parseTimeString(formData.endTime)}
                      onChange={(date) => {
                        handleInputChange({ target: { name: 'endTime', value: formatTimeForInput(date) } });
                      }}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      disabled={editingBatch && editingBatch.status === 'Live'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-slate-50 focus:bg-white font-medium text-slate-800 ${
                        formErrors.endTime ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      } ${editingBatch && editingBatch.status === 'Live' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                      placeholderText="--:-- --"
                    />
                  </div>
                  {formErrors.endTime && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors.endTime}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Section 3: Lab Credentials (Styled as Card) */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 17 9 19H7.414l-2.757-2.757a6 6 0 010-8.486L10 14" />
                   </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Lab Access Credentials</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure the environment access for students</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Login URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Lab URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      name="labCredentials.loginUrl"
                      value={formData.labCredentials.loginUrl}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white font-medium text-slate-800"
                      placeholder="https://lab.example.com"
                    />
                  </div>
                  {formErrors['labCredentials.loginUrl'] && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors['labCredentials.loginUrl']}</p>
                  )}
                </div>
                
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                     </div>
                    <input
                      type="text"
                      name="labCredentials.username"
                      value={formData.labCredentials.username}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white font-medium text-slate-800"
                      placeholder="student123"
                    />
                  </div>
                  {formErrors['labCredentials.username'] && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors['labCredentials.username']}</p>
                  )}
                </div>
                
                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                       </svg>
                     </div>
                    <input
                      type="text"
                      name="labCredentials.password"
                      value={formData.labCredentials.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white font-medium text-slate-800 font-mono"
                      placeholder="••••••••"
                    />
                  </div>
                  {formErrors['labCredentials.password'] && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium">{formErrors['labCredentials.password']}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* General Error */}
            {formErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 animate-fadeIn">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{formErrors.general}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 hover:text-slate-900 transition-all hover:border-slate-300 shadow-sm"
          >
            Cancel
          </button>
          
          <button
            form="session-form"
            type="submit"
            className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px]"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>{editingBatch ? 'Update Session' : 'Create Session'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionFormModal;
