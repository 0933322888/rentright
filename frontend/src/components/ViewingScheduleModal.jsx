import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';

const ViewingScheduleModal = ({ show, onHide, onSubmit, propertyTitle, propertyId }) => {
  const [wantsViewing, setWantsViewing] = useState(true);
  const [viewingDates, setViewingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && wantsViewing) {
      fetchViewingDates();
    }
  }, [show, wantsViewing]);

  const fetchViewingDates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.PROPERTIES}/${propertyId}/viewing-dates`);
      setViewingDates(response.data.dates || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching viewing dates:', error);
      toast.error('Failed to fetch available viewing dates');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (wantsViewing && (!selectedDate || !selectedTime)) {
      toast.error('Please select both date and time for viewing');
      return;
    }
    onSubmit({
      wantsViewing,
      viewingDate: wantsViewing ? selectedDate : undefined,
      viewingTime: wantsViewing ? selectedTime : undefined
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {wantsViewing ? 'Schedule Property Viewing' : 'Apply for Property'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Viewing Option Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you like to view the property before applying?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
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
                  type="button"
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
                <Form.Group>
                  <Form.Label>Select Viewing Date</Form.Label>
                  <Form.Select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required={wantsViewing}
                    disabled={loading}
                  >
                    <option value="">Choose a date...</option>
                    {viewingDates.map((date) => (
                      <option key={date.date} value={date.date}>
                        {new Date(date.date).toLocaleDateString()} ({date.availableSlots} slots available)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Time Selection */}
                {selectedDate && (
                  <Form.Group>
                    <Form.Label>Select Viewing Time</Form.Label>
                    <Form.Select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      required={wantsViewing}
                      disabled={loading}
                    >
                      <option value="">Choose a time...</option>
                      {viewingDates
                        .find((date) => date.date === selectedDate)
                        ?.timeSlots?.filter(slot => !slot.isBooked)
                        .map((slot) => (
                          <option key={slot.startTime} value={slot.startTime}>
                            {slot.startTime}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                )}
              </>
            )}

            {!wantsViewing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-yellow-800">
                  You are about to apply for this property without viewing it first. 
                  Make sure you have reviewed all the property details and photos before proceeding.
                </p>
              </div>
            )}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={wantsViewing && (!selectedDate || !selectedTime)}
        >
          {wantsViewing ? 'Schedule Viewing' : 'Apply Now'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewingScheduleModal; 