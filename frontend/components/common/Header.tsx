import React from 'react'
import Link from 'next/link'
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material'

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          DCMT Platform
        </Typography>
        <Button color="inherit" component={Link} href="/login">Login</Button>
        <Button color="inherit" component={Link} href="/signup">Sign Up</Button>
      </Toolbar>
    </AppBar>
  )
}

export default Header