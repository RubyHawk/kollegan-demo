/**
 * GET  /api/meetings  — list meetings for the organization
 * POST /api/meetings  — create a new meeting
 */

export { handleListMeetings as GET, handleCreateMeeting as POST } from '@modules/supporting/meetings';
