import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { router } from '../router.ts'
import App from './App.vue'
import './style.css'
import 'primeicons/primeicons.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      networkMode: 'always',
      staleTime: Infinity,
      gcTime: 60 * 60 * 1000,
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(VueQueryPlugin, { queryClient })
app.use(router)
app.use(pinia)
app.mount('#app')
