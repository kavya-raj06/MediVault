import { Router } from 'express';
import { listRecords, getRecordDetails, createRecord, updateRecord, deleteRecord, confirmRecord } from '../controllers/records';

const router = Router();

router.get('/', listRecords);
router.get('/:id', getRecordDetails);
router.post('/', createRecord);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);
router.post('/:id/confirm', confirmRecord);

export default router;
