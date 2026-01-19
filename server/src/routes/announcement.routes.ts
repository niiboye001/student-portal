import { Router } from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement, archiveAnnouncement } from '../controllers/announcement.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAnnouncements);
router.post('/', createAnnouncement);
router.put('/:id/archive', archiveAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;
