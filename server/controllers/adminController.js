import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import Application from '../models/applicationModel.js';
import TenantDocument from '../models/tenantDocumentModel.js';

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

    property.status = 'active';
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

    // Get application counts and tenant documents for each tenant
    const tenantsWithDetails = await Promise.all(
      tenants.map(async (tenant) => {
        const [applicationCount, tenantDocument] = await Promise.all([
          Application.countDocuments({ tenant: tenant._id }),
          TenantDocument.findOne({ tenant: tenant._id })
        ]);
        
        return {
          ...tenant.toObject(),
          applicationCount,
          tenantDocument: tenantDocument || null
        };
      })
    );

    res.json(tenantsWithDetails);
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

    // Get tenant document
    const tenantDocument = await TenantDocument.findOne({ tenant: tenant._id });

    // Get application count
    const applicationCount = await Application.countDocuments({ tenant: tenant._id });

    res.json({
      ...tenant.toObject(),
      applicationCount,
      tenantDocument: tenantDocument || null
    });
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

    // If application is approved, update property and handle other applications
    if (req.body.status.toLowerCase() === 'approved') {
      // Update the property's applications array
      await Property.findByIdAndUpdate(
        application.property._id,
        { 
          $set: {
            'applications.$[elem].status': 'approved'
          }
        },
        { 
          arrayFilters: [{ 'elem.tenant': application.tenant._id }]
        }
      );
      
      // Update property status
      await Property.findByIdAndUpdate(
        application.property._id,
        { 
          available: false,
          status: 'rented',
          tenant: application.tenant._id
        }
      );
      
      // Get all applications for this property
      const allPropertyApplications = await Application.find({
        property: application.property._id
      });

      // Update other applications
      for (const app of allPropertyApplications) {
        if (app._id.toString() !== application._id.toString()) {
          // If it's the same tenant's application
          if (app.tenant.toString() === application.tenant._id.toString()) {
            // If it's already approved, set to expired
            if (app.status === 'approved') {
              app.status = 'expired';
            } else {
              // Otherwise, set to declined
              app.status = 'declined';
            }
          } else {
            // For other tenants' applications, set to declined
            app.status = 'declined';
          }
          await app.save();
        }
      }

      // Also update all other applications of the same tenant for other properties
      const otherTenantApplications = await Application.find({
        tenant: application.tenant._id,
        _id: { $ne: application._id }
      });

      for (const app of otherTenantApplications) {
        if (app.status === 'approved') {
          app.status = 'expired';
        } else {
          app.status = 'declined';
        }
        await app.save();
      }
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
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