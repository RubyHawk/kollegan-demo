/**
 * GET    /api/meetings/[id]  — get meeting with participants and summary
 * PATCH  /api/meetings/[id]  — update meeting status / details
 * DELETE /api/meetings/[id]  — soft-delete meeting
 */

export {
  handleGetMeeting as GET,
  handleUpdateMeeting as PATCH,
  handleDeleteMeeting as DELETE,
} from '@modules/supporting/meetings';
