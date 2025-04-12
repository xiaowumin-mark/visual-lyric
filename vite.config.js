//vite.config.js html原生项目，没有框架

//vite.config.ts vue3项目，有框架
import { defineConfig } from 'vite'
import topLevelAwait from 'vite-plugin-top-level-await';
// 8081端口
export default defineConfig({
	plugins: [topLevelAwait()],
	server:{
		watch:{
			// 监听wasm文件
			ignored:['*.wasm']
		}
	}
})
