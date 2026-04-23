import React, { useEffect, useState } from 'react'
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Snackbar,
  Paper,
  Alert,
  Fade,
  CircularProgress,
  alpha,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { AuthService } from '../../services/auth.service'
import { Logo } from '../../assets/images'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success',
  })

  const navigate = useNavigate()
  const loginservice = new AuthService()

  useEffect(() => {
    console.log('Login Page Loaded')
  }, [])

  const validateUsername = (value: string): boolean => {
    if (value.length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }
    setError('')
    return true
  }

  const handleLogin = async () => {
    if (!username || !password) return

    try {
      setLoading(true)
      const response = await loginservice.login({ username, password })

      localStorage.setItem('access_token', JSON.stringify(response.token))
      //@ts-ignore
         localStorage.setItem('user', JSON.stringify(response.user))

      setSnackbar({
        open: true,
        message: 'Login successful! Redirecting...',
        type: 'success',
      })

      setTimeout(() => navigate('/'), 1000)
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Login failed. Please check your credentials.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        px: 2,
        py: { xs: 2, sm: 0 },
        background: 'linear-gradient(135deg, #313E17 0%, #1B0C0C 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${alpha('#FFDE42', 0.08)} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          animation: 'float 20s linear infinite',
        },
        '@keyframes float': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
        },
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: { xs: 'auto', sm: '100vh' },
        }}
      >
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              width: '100%',
              p: { xs: 2.5, sm: 4, md: 5 },
              borderRadius: { xs: 3, sm: 4 },
              background:
                'linear-gradient(135deg, rgba(76,92,45,0.3), rgba(27,12,12,0.7))',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,222,66,0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: '0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            {/* Top Gradient Line */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #4C5C2D, #FFDE42)',
              }}
            />

            {/* ✅ LOGO */}
            <Box display="flex" justifyContent="center" mb={3}>
              <Box
                component="img"
                src={Logo} // 🔁 replace this
                alt="logo"
                sx={{
                  width: { xs: 80, sm: 100 },
                  height: { xs: 80, sm: 100 },
                  borderRadius: '50%',
                  objectFit: 'contain',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  p: 1,
                  background: 'rgba(255,255,255,0.05)',
                }}
              />
            </Box>

            {/* Heading */}
            <Box textAlign="center" mb={3}>
              <Typography
                fontWeight="bold"
                sx={{
                  color: '#fff',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                Sign in to continue
              </Typography>
            </Box>

            {/* FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLogin()
              }}
            >
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
              />

              <TextField
                label="Password"
                fullWidth
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                      >
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
                  py: { xs: 1.3, sm: 1.5 },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  background: 'linear-gradient(135deg, #4C5C2D, #313E17)',
                }}
              >
                {loading ? (
                  <CircularProgress size={22} />
                ) : (
                  <>
                    <LoginIcon sx={{ mr: 1 }} />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Footer */}
            <Box textAlign="center" mt={3}>
              <Typography variant="caption" sx={{ color: '#aaa' }}>
                © {new Date().getFullYear()} Impronics
              </Typography>
            </Box>
          </Paper>
        </Fade>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() =>
            setSnackbar((prev) => ({ ...prev, open: false }))
          }
          sx={{
            width: { xs: '90%', sm: 'auto' },
            left: { xs: '5%', sm: 'auto' },
            right: { xs: '5%', sm: 24 },
          }}
        >
          <Alert severity={snackbar.type as any} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}

export default LoginPage