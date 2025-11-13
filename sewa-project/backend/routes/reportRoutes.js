import express from "express";
import{getOverviewReport, getDonationsReport,getImpactReport } from '../controllers/reportController.js'; 
const router = express.Router();
router.get('/overview/:ngoId', getOverviewReport);
router.get('/donations/:ngoId', getDonationsReport);
router.get('/impact/:ngoId', getImpactReport);
export default router;
