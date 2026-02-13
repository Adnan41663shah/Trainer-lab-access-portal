import { User } from '../models/User.js';

/**
 * Get all trainers (Admin only)
 * GET /api/users/trainers
 */
export const getTrainers = async (req, res, next) => {
  try {
    const trainers = await User.find({ role: 'trainer', isActive: true })
      .select('fullName email')
      .sort({ fullName: 1 });
    
    res.json({
      trainers: trainers.map(trainer => ({
        id: trainer._id,
        name: trainer.fullName,
        email: trainer.email
      }))
    });
    
  } catch (error) {
    next(error);
  }
};
