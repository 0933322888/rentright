export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('property')
      .populate('tenant', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the landlord owns the property
    if (application.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Prevent updating viewing applications
    if (application.status === 'viewing') {
      return res.status(400).json({ 
        message: 'Cannot update application status while viewing is pending. Please wait for the viewing to be completed.' 
      });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update application status
    application.status = status;
    await application.save();

    // Update property's applications array
    const property = await Property.findById(application.property._id);
    const applicationIndex = property.applications.findIndex(
      app => app.tenant.toString() === application.tenant._id.toString()
    );

    if (applicationIndex !== -1) {
      property.applications[applicationIndex].status = status;
      await property.save();
    }

    // If approved, update property status and tenant
    if (status === 'approved') {
      property.tenant = application.tenant._id;
      property.available = false;
      await property.save();

      // Reject all other pending applications
      await Application.updateMany(
        {
          property: property._id,
          _id: { $ne: application._id },
          status: { $in: ['pending', 'viewing'] }
        },
        { status: 'rejected' }
      );

      // Update property's applications array for rejected applications
      await Property.updateMany(
        { _id: property._id },
        {
          $set: {
            'applications.$[elem].status': 'rejected'
          }
        },
        {
          arrayFilters: [
            {
              'elem.tenant': { $ne: application.tenant._id },
              'elem.status': { $in: ['pending', 'viewing'] }
            }
          ]
        }
      );
    }

    res.json({
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(400).json({ message: error.message });
  }
}; 