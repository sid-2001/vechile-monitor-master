import { LocalStorageService } from '../../helpers/local-storage-service'
import { Avatar, Box, Chip, Divider, Menu, MenuItem, Typography } from '@mui/material'
import { useMemo, useState } from 'react'

const ProfileMenu = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const localService = new LocalStorageService()

  const userInfo = useMemo(() => {
    const storedUser = localService.get_user()
    if (storedUser) {
      return {
        name: storedUser?.name || storedUser?.username || 'User',
        role: storedUser?.role || 'User',
      }
    }

    try {
      const token = String(localService.get_accesstoken() || '').replace(/"/g, '')
      const payload = token?.split('.')[1]
      if (payload) {
        const parsed = JSON.parse(atob(payload))
        return {
          name: parsed?.username || parsed?.name || parsed?.sub || 'User',
          role: parsed?.role || 'Authenticated User',
        }
      }
    } catch (_e) {
      // ignore
    }

    return { name: 'User', role: 'Authenticated User' }
  }, [])

  const initials = userInfo.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x: string) => x[0]?.toUpperCase())
    .join('') || 'U'

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: { xs: 1, sm: 1.5 },
          py: 0.6,
          borderRadius: 10,
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.22)',
          '&:hover': { background: 'rgba(255,255,255,0.2)' }
        }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: '#0ea5e9', fontSize: 14 }}>{initials}</Avatar>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column' }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.1, fontSize: 13 }}>{userInfo.name}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>{userInfo.role}</Typography>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 260, borderRadius: 3, mt: 1 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography fontWeight={700}>{userInfo.name}</Typography>
          <Chip size='small' label={userInfo.role} sx={{ mt: 1 }} />
        </Box>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)}>My Profile</MenuItem>
        <MenuItem
          onClick={() => {
            localStorage.clear()
            sessionStorage.clear()
            window.location.reload()
          }}
          sx={{ color: '#dc2626' }}
        >
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}

export default ProfileMenu
