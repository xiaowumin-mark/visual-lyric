//vite.config.js html原生项目，没有框架

//vite.config.ts vue3项目，有框架
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path'
// 8081端口
export default defineConfig({
	plugins: [topLevelAwait()],
	build: {
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, 'index.html'),
				about: path.resolve(__dirname, 'visual-lyric.html'),
				// 添加其他HTML文件
				
			}
		}
	}
})
