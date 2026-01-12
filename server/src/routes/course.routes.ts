import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { getCourseDiscussions, createPost } from '../controllers/discussion.controller';

const router = Router();

router.use(authenticateToken); // Shared by students and staff

router.get('/:courseId/discussions', getCourseDiscussions);
router.post('/:courseId/discussions', createPost);

export default router;
