import React, { useEffect, useState } from 'react'
import { Container, TextField, Button, Box, Typography, InputAdornment, IconButton, Snackbar, Paper } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '@/services/auth.service'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: '' })

  const navigate = useNavigate()

  useEffect(()=>{

console.log("hello")
  },[])
  const validateUsername = (value: string): boolean => {
    if (value.length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }
    setError('')
    return true
  }

  let loginservice=new AuthService()
  const handleLogin = async () => {
    if (!username || !password) return

    try {
      setLoading(true)
      const response = await loginservice.login({ username, password })
      localStorage.setItem('access_token', JSON.stringify(response.token))
      setSnackbar({ open: true, message: 'Login successful!', type: 'success' })
      
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (err) {
      setSnackbar({ open: true, message: 'Login failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
    
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'white',
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Sign In
            </Typography>
            {/* <Typography variant="body2" color="text.secondary"> */}
        
            {/* </Typography> */}
          </Box>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                validateUsername(e.target.value)
              }}
              error={!!error}
              helperText={error}
              disabled={loading}
              required
            />

            <TextField
              label="Password"
              fullWidth
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!username || !password || !!error || loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#667eea',
                '&:hover': {
                  backgroundColor: '#5a67d8',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            © {new Date().getFullYear()} Your Company
          </Typography>
        </Paper>

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: snackbar.type === 'success' ? '#4caf50' : '#f44336',
            },
          }}
        />
      </Container>
    </Box>
  )
}

export default LoginPage