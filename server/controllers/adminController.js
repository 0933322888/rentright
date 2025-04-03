import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import Application from '../models/applicationModel.js';

// Get all properties for admin
export const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('landlord', 'name email')
      .populate('tenant', 'name email')
      .sort('-createdAt');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve property
export const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.status = 'Active';
    await property.save();

    res.json({ message: 'Property approved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all landlords for admin
export const getAllLandlords = async (req, res) => {
  try {
    const landlords = await User.find({ role: 'landlord' })
      .select('-password')
      .sort('-createdAt');

    // Get property counts for each landlord
    const landlordsWithPropertyCount = await Promise.all(
      landlords.map(async (landlord) => {
        const propertyCount = await Property.countDocuments({ landlord: landlord._id });
        return {
          ...landlord.toObject(),
          propertyCount
        };
      })
    );

    res.json(landlordsWithPropertyCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tenants for admin
export const getAllTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' })
      .select('-password')
      .sort('-createdAt');

    // Get application counts for each tenant
    const tenantsWithApplicationCount = await Promise.all(
      tenants.map(async (tenant) => {
        const applicationCount = await Application.countDocuments({ tenant: tenant._id });
        return {
          ...tenant.toObject(),
          applicationCount
        };
      })
    );

    res.json(tenantsWithApplicationCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all applications for admin
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('property', 'title location price')
      .populate('tenant', 'name email rating')
      .sort('-createdAt');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete tenant and their applications
export const deleteTenant = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'User is not a tenant' });
    }

    // Delete all applications associated with this tenant
    await Application.deleteMany({ tenant: tenant._id });

    // Delete the tenant
    await User.findByIdAndDelete(tenant._id);

    res.json({ message: 'Tenant and their applications deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single tenant
export const getTenantById = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'User is not a tenant' });
    }

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('property', 'landlord available')
      .populate('tenant', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = req.body.status;
    await application.save();

    // If application is approved, update property
    if (req.body.status === 'Approved') {
      await Property.findByIdAndUpdate(
        application.property._id,
        { 
          available: false,
          status: 'Rented',
          tenant: application.tenant._id
        }
      );
      
      // Reject all other pending applications for this property
      await Application.updateMany(
        {
          property: application.property._id,
          _id: { $ne: application._id },
          status: 'Pending'
        },
        { status: 'Declined' }
      );
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update tenant
export const updateTenant = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'User is not a tenant' });
    }

    // Update tenant fields
    tenant.name = req.body.name || tenant.name;
    tenant.email = req.body.email || tenant.email;
    tenant.phone = req.body.phone || tenant.phone;
    tenant.hasProfile = req.body.hasProfile !== undefined ? req.body.hasProfile : tenant.hasProfile;
    tenant.rating = req.body.rating !== undefined ? Number(req.body.rating) : tenant.rating;

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 