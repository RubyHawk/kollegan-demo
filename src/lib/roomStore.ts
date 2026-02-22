// Re-export from new location
export {
  getAllRooms,
  getAvailableRooms,
  lockRoom,
  confirmBooking,
  cancelBooking,
  bookRoom,
  setCallStatus,
  getFullState,
  resetRooms,
  logRoomsQueried,
  logActivity,
} from '@features/rooms/lib/room-store';
