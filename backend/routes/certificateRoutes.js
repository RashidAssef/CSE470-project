import express from 'express';
import {
  checkCourseCertificateEligibility,
  generateOrGetCertificate,
  downloadCertificatePDF,
  getMyCertificates,
  verifyCertificate,
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public certificate verification by credential ID
router.get('/verify/:certificateId', verifyCertificate);

// Student authenticated certificate routes
router.get('/my-certificates', protect, authorize('student', 'admin'), getMyCertificates);
router.get('/course/:courseId/status', protect, checkCourseCertificateEligibility);
router.post('/course/:courseId/generate', protect, authorize('student', 'admin'), generateOrGetCertificate);
router.get('/course/:courseId/download', protect, downloadCertificatePDF);

export default router;
