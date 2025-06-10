import Property from '../models/propertyModel.js';

export const loadProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    req.property = property;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 