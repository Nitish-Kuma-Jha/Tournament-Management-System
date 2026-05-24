import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

const savedUser = localStorage.getItem('user')
const savedToken = localStorage.getItem('accessToken')

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  accessToken: savedToken || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  isAuthenticated: !!savedToken,
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  try {
    const state = getState()
    await authAPI.logout({ refreshToken: state.auth.refreshToken })
  } catch (_) {}
})

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.getMe()
    return response.data.data.user
  } catch (error) {
    return rejectWithValue(error.response?.data?.message)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('accessToken', action.payload.accessToken)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
    // Called after a successful token rotation — updates BOTH tokens
    updateTokens: (state, action) => {
      state.accessToken = action.payload.accessToken
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      }
      localStorage.setItem('accessToken', action.payload.accessToken)
    },
    // Legacy alias (still used in some places)
    updateAccessToken: (state, action) => {
      state.accessToken = action.payload
      localStorage.setItem('accessToken', action.payload)
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
    clearAuth: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        localStorage.setItem('accessToken', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
        toast.success(`Welcome back, ${action.payload.user.name}! 🏆`)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        toast.error(action.payload)
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.clear()
        toast.success('Logged out successfully')
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
        localStorage.clear()
      })
  },
})

export const { setCredentials, updateTokens, updateAccessToken, updateUser, clearAuth } = authSlice.actions
export default authSlice.reducer
