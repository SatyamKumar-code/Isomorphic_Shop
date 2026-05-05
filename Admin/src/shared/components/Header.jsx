import React, { useEffect, useState } from 'react'
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useLocation, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggelButton';
import { useAuth } from '../../Context/auth/useAuth';
import useNotifications from '../../shared/hooks/useNotifications';

const Header = ({ title = 'Dashboard', searchPlaceholder = 'Search data, users, or reports' }) => {
  const { userData, logout } = useAuth();
  const { notifications, unreadCount, isLoading, isMarkingRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const menuOpen = Boolean(anchorEl);
  const notificationMenuOpen = Boolean(notificationAnchorEl);
  const avatarSrc = userData?.avatar || '/user.png';
  const avatarLabel = userData?.name || 'User';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = async (event) => {
    setNotificationAnchorEl(event.currentTarget);
    setVisibleNotifications(notifications.filter((notification) => !notification.isRead));
    await markAllAsRead();
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
    setVisibleNotifications([]);
  };

  const handleNotificationClick = (notification) => {
    handleNotificationMenuClose();
    if (notification?.link) {
      navigate(notification.link);
    }
  };

  const handleViewAllNotifications = () => {
    handleNotificationMenuClose();
    navigate('/notifications');
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile-settings');
  };

  const handleLogoutClick = async () => {
    handleMenuClose();
    await logout?.();
    navigate('/login');
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';

    if (location.pathname === '/search-result') {
      setSearchValue(query);
    }
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    const params = new URLSearchParams();

    if (query) {
      params.set('q', query);
    }

    navigate({
      pathname: '/search-result',
      search: params.toString(),
    });
  };

  return (
    <div>
      <header className='header h-24 ml-65 w-[calc(100%-217px)] flex items-center justify-between pl-5 pr-11 py-3 bg-white dark:bg-gray-950 dark:shadow-md  shadow-md shadow-gray-300 dark:shadow-gray-700' >
        <h2 className='font-bold text-black dark:text-white'>{title}</h2>

        <div className='flex items-center md:gap-4 lg:gap-8'>
          <form onSubmit={handleSearchSubmit} className='p-1.5 flex items-center justify-between pr-4 pl-6 lg:w-101.75 h-12 rounded-full bg-[#e7e8e8] dark:bg-[#f7fafa52] focus-within:ring-2 focus-within:ring-blue-500'>
            <input
              type='text'
              placeholder={searchPlaceholder}
              className='bg-transparent w-full text-[#4B5563] dark:text-white border-none focus:outline-none'
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <button type='submit' className='cursor-pointer' aria-label='Search globally'>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.3269 14.44L18.8 17.8M17.68 8.84C17.68 13.1699 14.1699 16.68 9.84 16.68C5.51009 16.68 2 13.1699 2 8.84C2 4.51009 5.51009 1 9.84 1C14.1699 1 17.68 4.51009 17.68 8.84Z" stroke-width="2" stroke-linecap="round" className='stroke-[#4B5563] dark:stroke-white' />
              </svg>
            </button>
          </form>
          <Badge color="error" badgeContent={unreadCount} max={99} invisible={unreadCount <= 0} overlap="circular">
            <IconButton
              type='button'
              onClick={handleNotificationMenuOpen}
              className='p-0 text-[#4B5563] dark:text-white'
              aria-label='Open notifications'
              aria-controls={notificationMenuOpen ? 'header-notification-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={notificationMenuOpen ? 'true' : undefined}
            >
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.33333 17.5H11.6667C11.6667 18.4166 10.9167 19.1666 10 19.1666C9.08333 19.1666 8.33333 18.4166 8.33333 17.5ZM17.5 15.8333V16.6666H2.5V15.8333L4.16667 14.1666V9.16663C4.16667 6.58329 5.83333 4.33329 8.33333 3.58329V3.33329C8.33333 2.41663 9.08333 1.66663 10 1.66663C10.9167 1.66663 11.6667 2.41663 11.6667 3.33329V3.58329C14.1667 4.33329 15.8333 6.58329 15.8333 9.16663V14.1666L17.5 15.8333ZM14.1667 9.16663C14.1667 6.83329 12.3333 4.99996 10 4.99996C7.66667 4.99996 5.83333 6.83329 5.83333 9.16663V15H14.1667V9.16663Z" className='fill-[#4B5563] dark:fill-white' />
              </svg>
            </IconButton>
          </Badge>

          <DarkModeToggle />

          <Menu
            id='header-notification-menu'
            anchorEl={notificationAnchorEl}
            open={notificationMenuOpen}
            onClose={handleNotificationMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            MenuListProps={{ className: 'p-0' }}
            PaperProps={{
              className: 'mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950!',
            }}
          >
            <div className='flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950'>
              <div>
                <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>Notifications</p>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              {isMarkingRead ? <span className='text-[11px] font-medium text-gray-400'>Updating</span> : null}
            </div>
            <Divider className='border-gray-200 dark:border-gray-600!' />
            <div className='max-h-96 overflow-y-auto'>
              {isLoading ? (
                <div className='px-4 py-6 text-sm text-gray-500 dark:text-gray-400'>Loading notifications...</div>
              ) : visibleNotifications.length ? (
                visibleNotifications.map((notification) => (
                  <MenuItem
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className='flex w-full items-start gap-3 px-4 py-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900'
                  >
                    <span className='mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-semibold text-gray-900 dark:text-gray-100'>{notification.title}</p>
                      <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
                        {notification.message}
                      </p>
                    </div>
                  </MenuItem>
                ))
              ) : (
                <div className='px-4 py-6 text-sm text-gray-500 dark:text-gray-400'>No unread notifications</div>
              )}
            </div>
            <Divider className='border-gray-200 dark:border-gray-600!' />
            <button
              type='button'
              onClick={handleViewAllNotifications}
              className='block w-full px-4 py-3 text-left text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
            >
              View all notifications
            </button>
          </Menu>

          <Badge
            overlap="circular"
            color="success"
            variant="dot"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <IconButton
              onClick={handleMenuOpen}
              className='p-0'
              aria-controls={menuOpen ? 'header-user-menu' : undefined}
              aria-haspopup='true'
              aria-expanded={menuOpen ? 'true' : undefined}
            >
              <Avatar
                src={avatarSrc}
                alt={avatarLabel}
                className='w-10 h-10 border border-gray-200 dark:border-gray-700'
              />
            </IconButton>
          </Badge>

          <Menu
            id='header-user-menu'
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            MenuListProps={{ className: 'p-0' }}
            PaperProps={{
              className: 'mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white dark:bg-gray-950! dark:border-gray-800 dark:bg-gray-950',
            }}
          >
            <div className='px-4 pb-1 bg-white dark:bg-gray-950'>
              <p className='text-sm font-semibold text-gray-900 dark:text-gray-100'>{avatarLabel}</p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                {userData?.email || 'Signed in account'}
              </p>
            </div>
            <Divider className='border-gray-200 dark:border-gray-600!' />
            <MenuItem onClick={handleProfileClick} className='flex w-full gap-1 px-4 py-2.5 text-sm text-gray-900 transition-colors hover:bg-gray-100 dark:text-gray-200! dark:hover:bg-gray-900'>
              <ListItemIcon className='min-w-0 text-inherit'>
                <svg width='18' height='18' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path d='M10 10C12.3012 10 14.1667 8.13452 14.1667 5.83333C14.1667 3.53215 12.3012 1.66667 10 1.66667C7.69881 1.66667 5.83333 3.53215 5.83333 5.83333C5.83333 8.13452 7.69881 10 10 10Z' stroke='#6A717F' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                  <path d='M3.33331 17.5C3.33331 14.5717 6.30981 12.5 10 12.5C13.6902 12.5 16.6666 14.5717 16.6666 17.5' stroke='#6A717F' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              </ListItemIcon>
              View Profile
            </MenuItem>
            <MenuItem onClick={handleLogoutClick} className='flex w-full gap-1 px-4 py-2.5 text-sm text-red-600! transition-colors hover:bg-red-50 dark:text-red-400! dark:hover:bg-red-950/30'>
              <ListItemIcon className='min-w-0 text-inherit'>
                <svg width='18' height='18' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path d='M7.5 17.5H5.83333C5.39131 17.5 4.96936 17.3244 4.6568 17.0118C4.34424 16.6993 4.16666 16.2774 4.16666 15.8333V4.16667C4.16666 3.72464 4.34424 3.30271 4.6568 2.99015C4.96936 2.67759 5.39131 2.5 5.83333 2.5H7.5' stroke='#6A717F' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                  <path d='M12.5 14.1667L15.8333 10M15.8333 10L12.5 5.83333M15.8333 10H7.5' stroke='#6A717F' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>

      </header>
    </div>
  )
}

export default Header