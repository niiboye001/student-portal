import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getCourseDiscussions, createPost } from '../controllers/discussion.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken); // Shared by students and staff

router.get('/:courseId/discussions', getCourseDiscussions);
router.post('/:courseId/discussions', upload.single('image'), createPost);

export default router;
