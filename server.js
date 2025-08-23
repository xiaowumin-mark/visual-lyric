import express from 'express'
import { createServer } from 'vite'
//fs
import fs from 'fs'




async function startServer() {
    const app = express()

    // Express API 路由
    app.get('/api/playlist', async (req, res) => {
        try {
            // 使用异步读取目录
            const files = await fs.promises.readdir('./music');

            // 预定义需要排除的扩展名
            const excludeExts = new Set(['ttml', 'png']);

            const result = [];
            const processedNames = new Set();

            // 先处理所有.ttml文件
            for (const file of files) {
                if (file.endsWith('.ttml')) {
                    const name = file.split('.')[0];
                    processedNames.add(name);

                    // 收集同名文件的其他扩展名
                    const otherExts = files
                        .filter(f => {
                            const [base] = f.split('.');
                            return base === name && !excludeExts.has(f.split('.').pop());
                        })
                        .map(f => f.split('.').pop());

                    result.push({
                        name,
                        ext: [...new Set(otherExts)][0] // 去重
                    });
                }
            }

            res.json(result);
        } catch (error) {
            console.error('Error reading directory:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/search', async (req, res) => {
        try {
            const query = req.query.q; // 获取搜索关键词
            if (!query || typeof query !== 'string' || query.trim() === '') {
                return res.status(400).json({ error: 'Missing or invalid search query' });
            }

            const searchTerm = query.trim().toLowerCase();
            const files = await fs.promises.readdir('./music');

            // 预定义需要排除的扩展名
            const excludeExts = new Set(['ttml', 'png']);

            const results = [];
            const processedNames = new Set();

            // 搜索逻辑
            for (const file of files) {
                const fileName = file.toLowerCase();
                const [name] = file.split('.');

                // 如果文件名包含搜索词且是音乐文件
                if (fileName.includes(searchTerm) && !processedNames.has(name)) {
                    // 如果是.ttml文件
                    if (file.endsWith('.ttml')) {
                        processedNames.add(name);

                        const otherExts = files
                            .filter(f => {
                                const [base] = f.split('.');
                                return base === name && !excludeExts.has(f.split('.').pop());
                            })
                            .map(f => f.split('.').pop());

                        results.push({
                            name,
                            ext: [...new Set(otherExts)] // 去重
                        });
                    }
                    // 如果不是.ttml但匹配搜索词
                    else if (!file.endsWith('.ttml') && !file.endsWith('.png')) {
                        const ext = file.split('.').pop();
                        if (!excludeExts.has(ext) && !processedNames.has(name)) {
                            processedNames.add(name);

                            // 检查是否有对应的.ttml文件
                            const hasTtml = files.some(f => f === `${name}.ttml`);

                            results.push({
                                name,
                                ext: [ext, ...(hasTtml ? [] : [])]
                            });
                        }
                    }
                }
            }

            res.json(results);
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // 创建 Vite 服务器
    const vite = await createServer({
        server: { middlewareMode: true }
    })

    // 使用 Vite 的中间件
    app.use(vite.middlewares)

    app.listen(8081, () => {
        console.log('服务器运行在 http://localhost:8081')
    })
}

startServer()

