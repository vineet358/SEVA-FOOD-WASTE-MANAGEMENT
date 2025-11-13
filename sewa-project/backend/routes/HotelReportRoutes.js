import express from 'express';
import { getReports } from '../controllers/HotelreportController.js';

const router = express.Router();

router.get('/:hotelId', getReports);

export default router;
