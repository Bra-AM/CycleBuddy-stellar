const express = require('express');
const router = express.Router();
const { categorize } = require('./vertex'); // Assuming vertex.js is in the same directory
const { authenticateUser } = require('../middlewares/auth');

function setupProductivityRoutes(pool) {
    // User creation route
    router.post('/task', authenticateUser, async (req, res) => {
        try {
            const {
                description,
            } = req.body;

            // Validate required fields
            if (!description) {
                return res.status(400).json({ error: 'Description is required' });
            }

            // Prepare parameters, using null for any undefined values
            const params = [
                description || null
            ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            // call vertex.js to categorize the task
            const category = await categorize(description);
            if (!category) {
                return res.status(400).json({ error: 'Category not found' });
            }

            const [result] = await pool.execute(
                `INSERT INTO il_app_tasks
                    (user_id, description, category_id, created_by, updated_by)
                    VALUES (?, ?, ?, ?, ?)`,
                [user_id, description || null, category || null, user_id, user_id]
            );

            res.status(200).json({ id: result.insertId, message: 'Task created' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Task already exists' });
            }
            res.status(500).json({ error: error.message });
        }
    });

    // Get all tasks from a user
    router.get('/productivity', authenticateUser, async (req, res) => {
        try {
            // const {
            //     init,
            //     end,
            // } = req.query;

            // // Prepare parameters, using null for any undefined values
            // const params = [
            //     init || null,
            //     end || null
            // ];

            // User ID is now available from the middleware
            const user_id = req.userId;

            let sqlQuery = `SELECT * FROM il_app_tasks WHERE user_id = ? AND status = 1`;
            let queryParams = [user_id];
            
            const [result] = await pool.execute(sqlQuery, queryParams);

            // group by category
            const groupedTasks = {};
            result.forEach(task => {
                if (!groupedTasks[task.category_id]) {
                    groupedTasks[task.category_id] = [];
                }
                groupedTasks[task.category_id].push(task);
            });
            
            res.status(200).json(groupedTasks);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete a task by ID
    router.delete('/task/:id', authenticateUser, async (req, res) => {
        try {
            const taskId = req.params.id;
            
            // User ID is now available from the middleware
            const user_id = req.userId;

            // First check if the task belongs to the user
            const [checkResult] = await pool.execute(
                'SELECT id FROM il_app_tasks WHERE id = ? AND user_id = ?',
                [taskId, user_id]
            );

            if (checkResult.length === 0) {
                return res.status(404).json({ error: 'task not found or not authorized to delete' });
            }

            // Delete the task
            const [deleteResult] = await pool.execute(
                'UPDATE il_app_tasks SET status = 0 WHERE id = ? AND user_id = ?',
                [taskId, user_id]
            );

            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'task not found' });
            }

            res.status(200).json({ message: 'task deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
}

module.exports = setupProductivityRoutes;