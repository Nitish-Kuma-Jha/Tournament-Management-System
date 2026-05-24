import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: localStorage.getItem('theme') || 'dark',
  commandPaletteOpen: false,
  isPageLoading: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload },
    toggleSidebarCollapsed: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', state.theme)
      document.documentElement.classList.toggle('dark', state.theme === 'dark')
    },
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
      document.documentElement.classList.toggle('dark', action.payload === 'dark')
    },
    toggleCommandPalette: (state) => { state.commandPaletteOpen = !state.commandPaletteOpen },
    setCommandPaletteOpen: (state, action) => { state.commandPaletteOpen = action.payload },
    setPageLoading: (state, action) => { state.isPageLoading = action.payload },
  },
})

export const {
  toggleSidebar, setSidebarOpen, toggleSidebarCollapsed,
  toggleTheme, setTheme, toggleCommandPalette, setCommandPaletteOpen,
  setPageLoading,
} = uiSlice.actions
export default uiSlice.reducer
