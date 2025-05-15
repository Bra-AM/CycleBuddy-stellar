const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/auth');

function setupCycleRoutes(pool) {
    
    // User creation route
    router.post('/cycle', authenticateUser, async (req, res) => {
        try {
            const {
                init,
                end,
            } = req.body;

            // Validate required fields
            if (!init || !end) {
                return res.status(400).json({ error: 'Init and End are required' });
            }

            // Prepare parameters, using null for any undefined values
            const params = [
                init || null,
                end || null
            ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            const [result] = await pool.execute(
                `INSERT INTO il_app_cycles
          (user_id, init, end, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?)`,
                [user_id, init || null, end || null, user_id, user_id]
            );

            res.status(200).json({ id: result.insertId, message: 'Cycle created' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Cycle already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    });

    // Get all cycles from a user
    router.get('/cycle', authenticateUser, async (req, res) => {
        try {
            const {
                init,
                end,
            } = req.query;

            // Prepare parameters, using null for any undefined values
            const params = [
                init || null,
                end || null
            ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            let sqlQuery = `SELECT * FROM il_app_cycles WHERE user_id = ? AND status = 1`;
            let queryParams = [user_id];

            if (init) {
                sqlQuery += ` AND init >= ?`;
                queryParams.push(init);
            }

            if (end) {
                sqlQuery += ` AND end <= ?`;
                queryParams.push(end);
            }

            sqlQuery += ` ORDER BY init ASC`;
            
            const [result] = await pool.execute(sqlQuery, queryParams);

            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete a cycle by ID
    router.delete('/cycle/:id', authenticateUser, async (req, res) => {
        try {
            const cycleId = req.params.id;
            
            // User ID is now available from the middleware
            const user_id = req.userId;

            // First check if the cycle belongs to the user
            const [checkResult] = await pool.execute(
                'SELECT id FROM il_app_cycles WHERE id = ? AND user_id = ?',
                [cycleId, user_id]
            );

            if (checkResult.length === 0) {
                return res.status(404).json({ error: 'Cycle not found or not authorized to delete' });
            }

            // Delete the cycle
            const [deleteResult] = await pool.execute(
                'UPDATE il_app_cycles SET status = 0 WHERE id = ? AND user_id = ?',
                [cycleId, user_id]
            );

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Cycle not found' });
            }

            res.status(200).json({ message: 'Cycle deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = setupCycleRoutes;
