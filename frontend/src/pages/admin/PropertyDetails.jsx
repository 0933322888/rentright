import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-hot-toast';
import ImageCarousel from '../../components/ImageCarousel';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function AdminPropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [adminComments, setAdminComments] = useState('');
  const [showAddDates, setShowAddDates] = useState(false);
  const [viewingDates, setViewingDates] = useState([]);
  const [editingDate, setEditingDate] = useState(null);
  const [editingStartTime, setEditingStartTime] = useState('');
  const [editingEndTime, setEditingEndTime] = useState('');

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ADMIN_PROPERTIES}/${id}/review`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProperty(response.data.property);
      setDocuments(response.data.documents);
      setAdminComments(response.data.property.adminComments || '');
    } catch (err) {
      setError('Failed to fetch property details');
      console.error('Error fetching property details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDate = () => {
    setViewingDates([...viewingDates, { date: null, timeSlots: [] }]);
  };

  const handleRemoveDate = (index) => {
    setViewingDates(viewingDates.filter((_, i) => i !== index));
  };

  const handleDateChange = (index, date) => {
    const newDates = [...viewingDates];
    newDates[index].date = date;
    setViewingDates(newDates);
  };

  const handleAddTimeSlot = (dateIndex) => {
    const newDates = [...viewingDates];
    newDates[dateIndex].timeSlots.push({ startTime: '', endTime: '' });
    setViewingDates(newDates);
  };

  const handleTimeSlotChange = (dateIndex, slotIndex, field, value) => {
    const newDates = [...viewingDates];
    newDates[dateIndex].timeSlots[slotIndex][field] = value;
    setViewingDates(newDates);
  };

  const handleRemoveTimeSlot = (dateIndex, slotIndex) => {
    const newDates = [...viewingDates];
    newDates[dateIndex].timeSlots = newDates[dateIndex].timeSlots.filter((_, i) => i !== slotIndex);
    setViewingDates(newDates);
  };

  const handleAddViewingDates = async () => {
    const invalidDates = viewingDates.some(date => !date.date || date.timeSlots.length === 0);
    if (invalidDates) {
      toast.error('Please ensure all dates have at least one time slot');
      return;
    }

    try {
      const dates = viewingDates.map(date => {
        console.log('Processing date:', date);
        const processedDate = {
          date: date.date.toISOString(),
          timeSlots: date.timeSlots.map(slot => {
            console.log('Processing time slot:', slot);
            return {
              startTime: slot.startTime,
              endTime: slot.endTime
            };
          })
        };
        console.log('Processed date:', processedDate);
        return processedDate;
      });
      console.log('Sending viewing dates:', JSON.stringify(dates, null, 2));

      const response = await axios.post(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${id}/viewing-dates`,
        { dates },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      console.log('Server response:', response.data);

      toast.success('Viewing dates added successfully');
      setShowAddDates(false);
      setViewingDates([]);
      fetchPropertyDetails();
    } catch (err) {
      console.error('Error adding viewing dates:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to add viewing dates');
    }
  };

  const handleApprove = async () => {
    try {
      await axios.patch(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${id}/approve`,
        { comments: adminComments },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Property approved successfully');
      navigate('/admin/properties');
    } catch (err) {
      toast.error('Failed to approve property');
      console.error('Error approving property:', err);
    }
  };

  const handleReject = async () => {
    if (!adminComments.trim()) {
      toast.error('Please provide comments for rejection');
      return;
    }

    try {
      await axios.patch(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${id}/reject`,
        { comments: adminComments },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast.success('Property rejected successfully');
      navigate('/admin/properties');
    } catch (err) {
      toast.error('Failed to reject property');
      console.error('Error rejecting property:', err);
    }
  };

  const handleEditDate = (date) => {
    const startTime = date.timeSlots.length > 0 ? date.timeSlots[0].startTime : '';
    const endTime = date.timeSlots.length > 0 ? date.timeSlots[date.timeSlots.length - 1].endTime : '';
    
    setEditingDate({
      _id: date._id,
      date: new Date(date.date)
    });
    setEditingStartTime(startTime);
    setEditingEndTime(endTime);
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setEditingStartTime('');
    setEditingEndTime('');
  };

  const handleUpdateViewingDate = async () => {
    if (!editingDate || !editingStartTime || !editingEndTime) {
      toast.error('Please provide a date, start time, and end time');
      return;
    }

    try {
      const response = await axios.patch(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${id}/viewing-dates/${editingDate._id}`,
        {
          date: editingDate.date.toISOString(),
          startTime: editingStartTime,
          endTime: editingEndTime
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Viewing date updated successfully');
      setEditingDate(null);
      setEditingStartTime('');
      setEditingEndTime('');
      fetchPropertyDetails();
    } catch (err) {
      console.error('Error updating viewing date:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to update viewing date');
    }
  };

  const handleDeleteViewingDate = async (dateId) => {
    if (!window.confirm('Are you sure you want to delete this viewing date?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_ENDPOINTS.ADMIN_PROPERTIES}/${id}/viewing-dates/${dateId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Viewing date deleted successfully');
      fetchPropertyDetails();
    } catch (err) {
      console.error('Error deleting viewing date:', err.response?.data || err);
      toast.error(err.response?.data?.message || 'Failed to delete viewing date');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!property) return <div className="text-center py-8">Property not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="mb-8">
          <ImageCarousel images={property.images} />
        </div>
        
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> {property.type}</p>
                <p><span className="font-medium">Price:</span> ${property.price}/month</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    property.status === 'active' ? 'bg-green-100 text-green-800' :
                    property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {property.status}
                  </span>
                </p>
                <p><span className="font-medium">Bedrooms:</span> {property.features?.bedrooms || 'N/A'}</p>
                <p><span className="font-medium">Bathrooms:</span> {property.features?.bathrooms || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Location</h2>
              <div className="space-y-2">
                <p>{property.location.street}</p>
                <p>{property.location.city}, {property.location.state} {property.location.zipCode}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{property.description}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {(property.amenities || []).map((amenity, index) => (
                <span
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  {amenity}
                </span>
              ))}
              {(!property.amenities || property.amenities.length === 0) && (
                <span className="text-gray-500">No amenities listed</span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Owner Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Landlord:</span> {property.landlord.name}</p>
              <p><span className="font-medium">Email:</span> {property.landlord.email}</p>
              {property.landlord.phone && (
                <p><span className="font-medium">Phone:</span> {property.landlord.phone}</p>
              )}
            </div>
          </div>

          {property.tenant && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Tenant Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {property.tenant.name}</p>
                <p><span className="font-medium">Email:</span> {property.tenant.email}</p>
                {property.tenant.phone && (
                  <p><span className="font-medium">Phone:</span> {property.tenant.phone}</p>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Property History</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Created:</span> {new Date(property.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Last Updated:</span> {new Date(property.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Property Documents Section */}
          {documents && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Property Documents</h2>
              <div className="space-y-4">
                {Object.entries(documents).map(([docType, docs]) => {
                  if (docType === 'property' || docType === '_id' || docType === 'createdAt' || docType === 'updatedAt') return null;
                  return (
                    <div key={docType} className="border rounded p-4">
                      <h3 className="font-medium mb-2">{docType.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      {docs && docs.length > 0 ? (
                        <div className="space-y-2">
                          {docs.map((doc, index) => (
                            <a
                              key={index}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:underline"
                            >
                              {doc.filename}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No documents uploaded</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Viewing Dates Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Viewing Dates</h2>
              {!editingDate && (
                <button
                  onClick={() => setShowAddDates(!showAddDates)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {showAddDates ? 'Cancel' : 'Add Viewing Dates'}
                </button>
              )}
            </div>

            {/* Edit Viewing Date Form */}
            {editingDate && (
              <div className="border rounded p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Edit Viewing Date</h3>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <DatePicker
                      selected={editingDate.date}
                      onChange={date => setEditingDate({ ...editingDate, date })}
                      minDate={new Date()}
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={editingStartTime}
                        onChange={(e) => setEditingStartTime(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={editingEndTime}
                        onChange={(e) => setEditingEndTime(e.target.value)}
                        className="border rounded px-3 py-2 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-2">
                    <p>Time slots will be automatically generated in 30-minute intervals between the start and end times.</p>
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleUpdateViewingDate}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                      Update Viewing Date
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add New Viewing Dates Form */}
            {showAddDates && !editingDate && (
              <div className="border rounded p-4 mb-4">
                <div className="space-y-6">
                  {viewingDates.map((dateData, dateIndex) => (
                    <div key={dateIndex} className="border rounded p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Date {dateIndex + 1}</h3>
                        <button
                          onClick={() => handleRemoveDate(dateIndex)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove Date
                        </button>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Date
                        </label>
                        <DatePicker
                          selected={dateData.date}
                          onChange={date => handleDateChange(dateIndex, date)}
                          minDate={new Date()}
                          className="border rounded px-3 py-2 w-full"
                        />
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Time Slots
                          </label>
                          <button
                            onClick={() => handleAddTimeSlot(dateIndex)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            + Add Time Slot
                          </button>
                        </div>

                        {dateData.timeSlots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex gap-4 mb-2">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={e => handleTimeSlotChange(dateIndex, slotIndex, 'startTime', e.target.value)}
                              className="border rounded px-3 py-2"
                            />
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={e => handleTimeSlotChange(dateIndex, slotIndex, 'endTime', e.target.value)}
                              className="border rounded px-3 py-2"
                            />
                            <button
                              onClick={() => handleRemoveTimeSlot(dateIndex, slotIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddDate}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800"
                  >
                    + Add Another Date
                  </button>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleAddViewingDates}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                      Save All Viewing Dates
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Display existing viewing dates */}
            {property.viewingDates && property.viewingDates.length > 0 ? (
              <div className="space-y-4">
                {property.viewingDates.map((date) => (
                  <div key={date._id} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">
                        {new Date(date.date).toLocaleDateString()}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditDate(date)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteViewingDate(date._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {date.timeSlots.length > 0 ? (
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-600">
                            Total slots: {date.timeSlots.length}
                          </p>
                          <div className="flex gap-4">
                            <p className="text-sm text-green-600">
                              Available: {date.timeSlots.filter(slot => !slot.isBooked).length}
                            </p>
                            <p className="text-sm text-red-600">
                              Booked: {date.timeSlots.filter(slot => slot.isBooked).length}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {date.timeSlots.map((slot, index) => (
                            <div
                              key={index}
                              className={`text-sm p-3 rounded-lg border ${
                                slot.isBooked
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-green-50 border-green-200 text-green-800'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  {slot.isBooked && (
                                    <div className="mt-1 text-xs">
                                      <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                                        Booked
                                      </span>
                                      {slot.bookedBy && (
                                        <div className="mt-1 text-gray-600">
                                          By: {slot.bookedBy.name || 'Tenant'}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {!slot.isBooked && (
                                  <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                                    Available
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">No time slots available</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No viewing dates scheduled</p>
            )}
          </div>

          {/* Property Actions Section */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Property Actions</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Comments
                </label>
                <textarea
                  value={adminComments}
                  onChange={e => setAdminComments(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows="4"
                  placeholder="Add your comments about the property..."
                />
              </div>
              <div className="flex gap-4">
                {property.status !== 'active' && (
                  <button
                    onClick={handleApprove}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Approve for Listing
                  </button>
                )}
                {property.status !== 'active' && (
                  <button
                    onClick={handleReject}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                  >
                    Reject Property
                  </button>
                )}
                {property.status === 'active' && (
                  <div className="text-green-600 font-medium">
                    ✓ Property is approved and listed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 