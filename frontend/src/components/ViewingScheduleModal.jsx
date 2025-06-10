import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';

const ViewingScheduleModal = ({ show, onHide, onSubmit, propertyTitle, propertyId }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [wantsViewing, setWantsViewing] = useState(false);

  // Fetch available dates when modal opens
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!propertyId) return;

      setLoadingDates(true);
      try {
        const response = await axios.get(
          `${API_ENDPOINTS.PROPERTIES}/${propertyId}/viewing-dates`
        );
        setAvailableDates(response.data.dates);
        
        // If there are available dates and wantsViewing is true, select the first available date
        if (response.data.dates.length > 0 && wantsViewing) {
          setSelectedDate(new Date(response.data.dates[0].date));
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
        toast.error('Failed to fetch available dates');
        setAvailableDates([]);
      } finally {
        setLoadingDates(false);
      }
    };

    if (show) {
      fetchAvailableDates();
    }
  }, [propertyId, show, wantsViewing]);

  // Fetch available time slots when date changes
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!propertyId || !selectedDate || !wantsViewing) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${API_ENDPOINTS.PROPERTIES}/${propertyId}/viewing-slots`,
          {
            params: {
              date: selectedDate.toISOString().split('T')[0]
            }
          }
        );
        setAvailableTimeSlots(response.data.timeSlots);
        setSelectedTime(''); // Reset selected time when date changes
      } catch (error) {
        console.error('Error fetching time slots:', error);
        toast.error('Failed to fetch available time slots');
        setAvailableTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTimeSlots();
  }, [propertyId, selectedDate, wantsViewing]);

  const handleSubmit = () => {
    if (wantsViewing && (!selectedDate || !selectedTime)) {
      toast.error('Please select a viewing date and time');
      return;
    }
    onSubmit({
      wantsViewing,
      viewingDate: selectedDate,
      viewingTime: selectedTime
    });
  };

  // Custom date filter for DatePicker
  const filterAvailableDates = (date) => {
    return availableDates.some(
      availableDate => 
        new Date(availableDate.date).toDateString() === date.toDateString()
    );
  };

  // Get available slots count for a date
  const getAvailableSlotsCount = (date) => {
    const availableDate = availableDates.find(
      d => new Date(d.date).toDateString() === date.toDateString()
    );
    return availableDate ? availableDate.availableSlots : 0;
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {wantsViewing ? 'Schedule Property Viewing' : 'Apply for Property'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          {/* Viewing Option Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Would you like to view the property before applying?
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setWantsViewing(true)}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  wantsViewing
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Yes, I want to view
              </button>
              <button
                onClick={() => setWantsViewing(false)}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  !wantsViewing
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                No, apply without viewing
              </button>
            </div>
          </div>

          {wantsViewing && (
            <>
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                {loadingDates ? (
                  <p className="text-gray-500">Loading available dates...</p>
                ) : availableDates.length > 0 ? (
                  <DatePicker
                    selected={selectedDate}
                    onChange={date => setSelectedDate(date)}
                    filterDate={filterAvailableDates}
                    minDate={new Date()}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Select a date"
                    dateFormat="MMMM d, yyyy"
                    renderDayContents={(day, date) => {
                      const slotsCount = getAvailableSlotsCount(date);
                      return (
                        <div className="flex flex-col items-center">
                          <span>{day}</span>
                          {slotsCount > 0 && (
                            <span className="text-xs text-green-600">
                              {slotsCount} slots
                            </span>
                          )}
                        </div>
                      );
                    }}
                  />
                ) : (
                  <p className="text-gray-500">No available viewing dates</p>
                )}
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Time
                </label>
                {loading ? (
                  <p className="text-gray-500">Loading available time slots...</p>
                ) : availableTimeSlots.length > 0 ? (
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a time</option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot.startTime} value={`${slot.startTime}-${slot.endTime}`}>
                        {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-500">No available time slots for this date</p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={wantsViewing && (!selectedDate || !selectedTime) || loading || loadingDates}
        >
          {wantsViewing ? 'Schedule Viewing' : 'Apply Now'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewingScheduleModal; 