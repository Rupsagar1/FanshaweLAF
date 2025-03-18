const Item = require('../models/Item');
const { uploadToCloudinary } = require('../utils/cloudinary');

// Create a new item
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status,
      location,
      date,
      firstName,
      lastName,
      email,
      phone,
      detailedInfo,
    } = req.body;

    // Handle image uploads
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
        imageUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error('Error uploading images:', uploadError);
        // Continue without images if upload fails
        imageUrls = [];
      }
    }

    const item = new Item({
      title,
      description: description || detailedInfo || 'No description provided',
      category,
      status,
      location,
      date,
      images: imageUrls,
      reporter: {
        firstName,
        lastName,
        email,
        phone,
      },
    });

    // Validate that description exists before saving
    if (!item.description) {
      throw new Error('Description is required');
    }

    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
};

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error updating item', error: error.message });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error: error.message });
  }
};

// Claim item
exports.claimItem = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, verificationCode } = req.body;
    
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status === 'claimed') {
      return res.status(400).json({ message: 'Item has already been claimed' });
    }

    item.claimant = {
      firstName,
      lastName,
      email,
      phone,
      verificationCode,
      claimDate: new Date(),
    };
    item.status = 'claimed';

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error claiming item', error: error.message });
  }
};

// Search items
exports.searchItems = async (req, res) => {
  try {
    const { query } = req.query;
    const items = await Item.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error searching items', error: error.message });
  }
};

// Filter items
exports.filterItems = async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.location) filters.location = req.query.location;

    const items = await Item.find(filters);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error filtering items', error: error.message });
  }
}; 