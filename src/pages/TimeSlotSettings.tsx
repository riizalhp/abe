import React, { useState, useEffect, useCallback } from 'react';
import timeSlotService, { TimeSlot } from '../../services/timeSlotService';
import { useBranch } from '../../lib/BranchContext';

export const TimeSlotSettings: React.FC = () => {
  const { activeBranch } = useBranch();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [newSlot, setNewSlot] = useState({
    time: '',
    maxBookings: 5,
    isActive: true,
    dayOfWeek: []
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTimeSlots = useCallback(() => {
    const slots = timeSlotService.getAllTimeSlots();
    setTimeSlots(slots);
  }, []);

  useEffect(() => {
    loadTimeSlots();

    // Listen for branch change
    const handleBranchChange = () => {
      loadTimeSlots();
      setIsAddingSlot(false);
      setEditingSlot(null);
      setNewSlot({
        time: '',
        maxBookings: 5,
        isActive: true,
        dayOfWeek: []
      });
    };

    window.addEventListener('branchChanged', handleBranchChange);
    return () => window.removeEventListener('branchChanged', handleBranchChange);
  }, [loadTimeSlots]);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddSlot = () => {
    if (!newSlot.time) {
      alert('Please enter a valid time');
      return;
    }

    // Check for duplicate times
    const isDuplicate = timeSlots.some(slot => slot.time === newSlot.time);
    if (isDuplicate) {
      alert('This time slot already exists');
      return;
    }

    const label = timeSlotService.formatTime(newSlot.time);

    timeSlotService.saveTimeSlot({
      ...newSlot,
      label,
      dayOfWeek: []
    });

    loadTimeSlots();
    setIsAddingSlot(false);
    setNewSlot({
      time: '',
      maxBookings: 5,
      isActive: true,
      dayOfWeek: []
    });
    showSuccessMessage('Time slot added successfully!');
  };

  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot({ ...slot });
  };

  const handleUpdateSlot = () => {
    if (!editingSlot) return;

    const label = timeSlotService.formatTime(editingSlot.time);

    timeSlotService.updateTimeSlot(editingSlot.id, {
      ...editingSlot,
      label
    });

    loadTimeSlots();
    setEditingSlot(null);
    showSuccessMessage('Time slot updated successfully!');
  };

  const handleDeleteSlot = (id: string) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      timeSlotService.deleteTimeSlot(id);
      loadTimeSlots();
      showSuccessMessage('Time slot deleted successfully!');
    }
  };

  const handleToggleActive = (slot: TimeSlot) => {
    timeSlotService.updateTimeSlot(slot.id, { isActive: !slot.isActive });
    loadTimeSlots();
    showSuccessMessage(`Time slot ${slot.isActive ? 'deactivated' : 'activated'}!`);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset to default time slots? This will remove all custom slots.')) {
      timeSlotService.resetToDefaults();
      loadTimeSlots();
      showSuccessMessage('Reset to default time slots successfully!');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Time Slot Settings</h1>
          {activeBranch && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {activeBranch.name}
            </span>
          )}
        </div>
        <p className="text-gray-600">
          Manage available booking time slots for customers.
          {activeBranch && <span className="text-blue-600"> (Pengaturan untuk cabang: {activeBranch.name})</span>}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 flex items-center">
            <span className="material-symbols-outlined mr-2">check_circle</span>
            {successMessage}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setIsAddingSlot(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Add Time Slot
        </button>

        <button
          onClick={handleResetDefaults}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">refresh</span>
          Reset to Defaults
        </button>
      </div>

      {/* Add New Slot Modal */}
      {isAddingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Time Slot</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={newSlot.time}
                  onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Bookings</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newSlot.maxBookings}
                  onChange={(e) => setNewSlot({ ...newSlot, maxBookings: parseInt(e.target.value) || 5 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="new-slot-active"
                  checked={newSlot.isActive}
                  onChange={(e) => setNewSlot({ ...newSlot, isActive: e.target.checked })}
                  className="mr-3"
                />
                <label htmlFor="new-slot-active" className="text-sm font-medium text-gray-700">
                  Active (available for booking)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setIsAddingSlot(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Time Slot</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={editingSlot.time}
                  onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Bookings</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editingSlot.maxBookings || 5}
                  onChange={(e) => setEditingSlot({ ...editingSlot, maxBookings: parseInt(e.target.value) || 5 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-slot-active"
                  checked={editingSlot.isActive}
                  onChange={(e) => setEditingSlot({ ...editingSlot, isActive: e.target.checked })}
                  className="mr-3"
                />
                <label htmlFor="edit-slot-active" className="text-sm font-medium text-gray-700">
                  Active (available for booking)
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setEditingSlot(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSlot}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Slots List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Current Time Slots ({timeSlots.length})</h2>
          <p className="text-gray-600 text-sm mt-1">
            Active slots: {timeSlots.filter(slot => slot.isActive).length}
          </p>
        </div>

        {timeSlots.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-gray-400 text-4xl mb-4 block">schedule</span>
            <p className="text-gray-500 text-lg mb-2">No time slots configured</p>
            <p className="text-gray-400">Add your first time slot to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {timeSlots.map((slot) => (
              <div key={slot.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${slot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{slot.label}</h3>
                      {!slot.isActive && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Max {slot.maxBookings || 5} bookings • {slot.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(slot)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${slot.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                  >
                    {slot.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleEditSlot(slot)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">ℹ️ How it works</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Active time slots will be available for customer booking</li>
          <li>• Inactive slots are hidden from customers but preserved in settings</li>
          <li>• Max bookings limit prevents overbooking for each time slot</li>
          <li>• Changes take effect immediately for new bookings</li>
          <li>• Time slots are sorted automatically by time</li>
        </ul>
      </div>
    </div>
  );
};